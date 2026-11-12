#!/usr/bin/env node
// Checks the admin-host guard (server/middleware/studio-host.ts) against a
// local `wrangler dev` of the Cloudflare build, plus the Access JWT verifier
// (server/utils/access-jwt.ts) directly in Node.
//
// Build first:  NITRO_PRESET=cloudflare_module npm run build
// Then run:     node scripts/check-studio-guard.mjs
//
// Everything here is local and uses dummy values only. The wrangler config is
// copied with D1 `remote: true` stripped and run with --local, and the env
// files are written to a temp directory, never into the repo.
//
// Not covered: a real Cloudflare Access JWT fetched against the live team
// JWKS. That cannot be produced locally, so the admin-host happy path is
// only exercised with a locally signed token in the Node section.
import { spawn } from 'node:child_process'
import { createHmac, generateKeyPairSync } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { request } from 'node:http'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(fileURLToPath(import.meta.url), '../..')
const SERVER_DIR = join(ROOT, '.output/server')
const ADMIN_HOST = 'admin.codertheory.dev'
const PUBLIC_HOST = 'codertheory.dev'
const TEAM_DOMAIN = 'guard-test.invalid'
const AUD = 'guard-test-aud'
const PORT = 8799

let failures = 0
function check(name, ok, detail = '') {
    if (!ok) failures++
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`)
}

const b64url = input => Buffer.from(input).toString('base64url')

function unsignedJwt(payload) {
    return `${b64url(JSON.stringify({alg: 'none', typ: 'JWT'}))}.${b64url(JSON.stringify(payload))}.`
}

function hs256Jwt(payload, secret) {
    const head = `${b64url(JSON.stringify({alg: 'HS256', typ: 'JWT'}))}.${b64url(JSON.stringify(payload))}`
    return `${head}.${createHmac('sha256', secret).update(head).digest('base64url')}`
}

function claims(overrides = {}) {
    const now = Math.floor(Date.now() / 1000)
    return {aud: [AUD], iss: `https://${TEAM_DOMAIN}`, sub: 'guard', email: 'guard@example.invalid', iat: now, exp: now + 600, ...overrides}
}

// Raw http so the Host header can be set (fetch drops it).
function get(path, {host, headers = {}} = {}) {
    return new Promise((done, fail) => {
        const req = request({host: '127.0.0.1', port: PORT, path, method: 'GET', headers: {host, ...headers}}, (res) => {
            let body = ''
            res.setEncoding('utf8')
            res.on('data', d => body += d)
            res.on('end', () => done({status: res.statusCode, headers: res.headers, body}))
        })
        req.on('error', fail)
        req.setTimeout(30000, () => req.destroy(new Error('timeout')))
        req.end()
    })
}

async function startWrangler(configPath, envFile) {
    const child = spawn('npx', ['wrangler', 'dev', '-c', configPath, '--local', '--ip', '127.0.0.1', '--port', String(PORT),
        '--env-file', envFile, '--show-interactive-dev-session=false', '--log-level', 'warn'], {
        cwd: ROOT,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {...process.env, CI: '1'}
    })
    let log = ''
    child.stdout.on('data', d => log += d)
    child.stderr.on('data', d => log += d)
    const deadline = Date.now() + 90000
    while (Date.now() < deadline) {
        if (child.exitCode !== null) throw new Error(`wrangler dev exited early:\n${log}`)
        try {
            await get('/', {host: PUBLIC_HOST})
            return child
        } catch {
            await new Promise(r => setTimeout(r, 500))
        }
    }
    child.kill()
    throw new Error(`wrangler dev did not start:\n${log}`)
}

async function stopWrangler(child) {
    if (child.exitCode !== null) return
    const exited = new Promise(r => child.once('exit', r))
    child.kill('SIGTERM')
    await Promise.race([exited, new Promise(r => setTimeout(r, 5000))])
    if (child.exitCode === null) child.kill('SIGKILL')
}

const isNoindex = res => /noindex/i.test(String(res.headers['x-robots-tag'] || ''))

// Public-host spellings of Studio routes. Some never reach a Studio handler
// (the router is case-sensitive and does not decode), but each must 404.
const PUBLIC_STUDIO_PATHS = [
    '/_studio',
    '/_studio/',
    '/_studio?redirect=/about',
    '/__nuxt_studio/auth/session',
    '/__nuxt_studio/auth/github',
    '/__nuxt_studio/meta',
    '/sw.js',
    '/_STUDIO',
    '/_Studio',
    '/%5Fstudio',
    '/%5fstudio',
    '/%255Fstudio',
    '//_studio',
    '///_studio/',
    '/__NUXT_STUDIO/auth/session',
    '/%5F%5Fnuxt_studio/auth/session',
    '/__nuxt%5Fstudio/auth/session',
    '//__nuxt_studio//auth//session',
    '/__nuxt_studio%2Fauth%2Fsession',
    '/SW.JS'
]

async function liveChecks(tmp, wranglerConfig) {
    const fullEnv = join(tmp, 'full.env')
    const noAccessEnv = join(tmp, 'no-access.env')
    const studioVars = [
        'NUXT_STUDIO_AUTH_GITHUB_CLIENT_ID=dummy-client-id',
        'NUXT_STUDIO_AUTH_GITHUB_CLIENT_SECRET=dummy-client-secret',
        'NUXT_STUDIO_AUTH_GITHUB_MODERATORS=nobody@example.invalid',
        'NUXT_STUDIO_AUTH_SESSION_SECRET=dummy-session-secret-0123456789abcdef'
    ]
    await writeFile(fullEnv, [...studioVars, `NUXT_ACCESS_TEAM_DOMAIN=${TEAM_DOMAIN}`, `NUXT_ACCESS_AUD=${AUD}`].join('\n') + '\n')
    await writeFile(noAccessEnv, studioVars.join('\n') + '\n')

    const {privateKey} = generateKeyPairSync('rsa', {modulusLength: 2048})
    const {SignJWT, importPKCS8} = await import('jose')
    const rsKey = await importPKCS8(privateKey.export({type: 'pkcs8', format: 'pem'}), 'RS256')
    const rs256Unknown = await new SignJWT(claims()).setProtectedHeader({alg: 'RS256', kid: 'not-a-cloudflare-key'}).sign(rsKey)

    console.log('\n-- wrangler dev, Access config set (dummy team domain and aud)')
    let child = await startWrangler(wranglerConfig, fullEnv)
    try {
        const noToken = await get('/', {host: ADMIN_HOST})
        check('admin / with no token -> 403', noToken.status === 403, `got ${noToken.status}`)
        check('admin 403 response carries X-Robots-Tag noindex', isNoindex(noToken), `x-robots-tag=${noToken.headers['x-robots-tag']}`)

        for (const path of ['/_studio', '/__nuxt_studio/auth/session', '/sw.js', '/about', '/projects/rolesmith', '/sitemap.xml', '/api/__sitemap__/urls']) {
            const res = await get(path, {host: ADMIN_HOST})
            check(`admin ${path} with no token -> 403`, res.status === 403, `got ${res.status}`)
        }

        // Known limits, asserted so a change shows up here. Nitro runs routeRules
        // before any middleware, so the two static redirects in nuxt.config.ts
        // answer without a token; they only point at another path on the same
        // host, which then needs the token. Static files skip the Worker.
        const ruleRedirect = await get('/projects/job-pipeline', {host: ADMIN_HOST})
        check('known: admin routeRules redirect answers before the guard (301 to a same-host path)',
            ruleRedirect.status === 301 && ruleRedirect.headers.location === '/projects/rolesmith',
            `got ${ruleRedirect.status} ${ruleRedirect.headers.location}`)
        const staticFile = await get('/_nuxt/builds/latest.json', {host: ADMIN_HOST})
        check('known: admin static asset is served before the Worker (200)', staticFile.status === 200, `got ${staticFile.status}`)

        const tokens = {
            'garbage header token': {'cf-access-jwt-assertion': 'not-a-jwt'},
            'garbage CF_Authorization cookie': {cookie: 'CF_Authorization=not-a-jwt'},
            'alg:none token': {'cf-access-jwt-assertion': unsignedJwt(claims())},
            'HS256 token': {'cf-access-jwt-assertion': hs256Jwt(claims(), AUD)},
            'RS256 token from an unknown key': {'cf-access-jwt-assertion': rs256Unknown},
            'RS256 token from an unknown key in the cookie': {cookie: `CF_Authorization=${rs256Unknown}`}
        }
        for (const [name, headers] of Object.entries(tokens)) {
            const res = await get('/', {host: ADMIN_HOST, headers})
            check(`admin / with ${name} -> 403`, res.status === 403, `got ${res.status}`)
        }

        const adminPort = await get('/', {host: `${ADMIN_HOST}:443`})
        check('admin host with a port suffix -> 403', adminPort.status === 403, `got ${adminPort.status}`)
        const adminUpper = await get('/', {host: 'ADMIN.codertheory.dev'})
        check('admin host in upper case -> 403', adminUpper.status === 403, `got ${adminUpper.status}`)

        for (const path of PUBLIC_STUDIO_PATHS) {
            const res = await get(path, {host: PUBLIC_HOST})
            check(`public ${path} -> 404`, res.status === 404, `got ${res.status}`)
        }

        const sitemap = await get('/sitemap.xml', {host: PUBLIC_HOST})
        const locs = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
        check('public /sitemap.xml lists URLs', sitemap.status === 200 && locs.length > 0, `got ${sitemap.status}, ${locs.length} URLs`)
        check('public /sitemap.xml lists no Studio route', !locs.some(loc => /_studio|__nuxt_studio|\/sw\.js/i.test(loc)), locs.filter(loc => /studio|sw\.js/i.test(loc)).join(' '))

        for (const path of ['/', '/about']) {
            const res = await get(path, {host: PUBLIC_HOST})
            check(`public ${path} -> 200`, res.status === 200, `got ${res.status}`)
            check(`public ${path} has no noindex header`, !isNoindex(res), `x-robots-tag=${res.headers['x-robots-tag']}`)
        }
    } finally {
        await stopWrangler(child)
    }

    console.log('\n-- wrangler dev, Access config unset')
    child = await startWrangler(wranglerConfig, noAccessEnv)
    try {
        for (const path of ['/', '/_studio', '/__nuxt_studio/auth/session']) {
            const res = await get(path, {host: ADMIN_HOST})
            check(`admin ${path} with Access config unset -> 403`, res.status === 403, `got ${res.status}`)
        }
        const forged = await get('/', {host: ADMIN_HOST, headers: {'cf-access-jwt-assertion': unsignedJwt(claims())}})
        check('admin / with a token and Access config unset -> 403', forged.status === 403, `got ${forged.status}`)
        const pub = await get('/about', {host: PUBLIC_HOST})
        check('public /about with Access config unset -> 200', pub.status === 200, `got ${pub.status}`)
    } finally {
        await stopWrangler(child)
    }
}

// Path and host matching in Node, including spellings the router would not
// route to Studio today, so a router change cannot open a gap.
async function pathChecks() {
    console.log('\n-- Studio path and host matching (Node)')
    let mod
    try {
        mod = await import(pathToFileURL(join(ROOT, 'server/utils/studio-path.ts')).href)
    } catch (error) {
        check('server/utils/studio-path.ts loads', false, error.code || error.message)
        return
    }
    const studio = [...PUBLIC_STUDIO_PATHS, '/_studio-app/1.8.1/main.js', '/%5C_studio', '\\_studio', '/__nuxt_studio', '/%25255Fstudio']
    for (const path of studio) check(`isStudioPath(${JSON.stringify(path)}) -> true`, mod.isStudioPath(path) === true)
    const notStudio = ['/', '/about', '/studio', '/blog/_studio-notes', '/projects/rolesmith', '/sw.json', '/%E0%A4%A', '/_nuxt/builds/latest.json', '/api/__sitemap__/urls']
    for (const path of notStudio) check(`isStudioPath(${JSON.stringify(path)}) -> false`, mod.isStudioPath(path) === false)
    const hosts = [['admin.codertheory.dev', 'admin.codertheory.dev'], ['ADMIN.codertheory.dev:443', 'admin.codertheory.dev'], ['admin.codertheory.dev.', 'admin.codertheory.dev'], ['', ''], [undefined, '']]
    for (const [raw, want] of hosts) check(`normaliseHost(${JSON.stringify(raw)}) -> ${JSON.stringify(want)}`, mod.normaliseHost(raw) === want)
}

// The verifier in Node, with a local key set standing in for Cloudflare's.
async function unitChecks() {
    console.log('\n-- Access JWT verifier (Node, local key set)')
    let mod
    try {
        mod = await import(pathToFileURL(join(ROOT, 'server/utils/access-jwt.ts')).href)
    } catch (error) {
        check('server/utils/access-jwt.ts loads', false, error.code || error.message)
        return
    }
    const {SignJWT, createLocalJWKSet, exportJWK, generateKeyPair} = await import('jose')
    const {publicKey, privateKey} = await generateKeyPair('RS256')
    const {privateKey: otherKey} = await generateKeyPair('RS256')
    const jwk = {...await exportJWK(publicKey), kid: 'k1', alg: 'RS256'}
    const jwks = createLocalJWKSet({keys: [jwk]})
    const config = mod.resolveAccessConfig({teamDomain: TEAM_DOMAIN, aud: AUD})
    check('resolveAccessConfig accepts a team domain and aud', config?.teamDomain === TEAM_DOMAIN && config?.aud === AUD)
    check('resolveAccessConfig strips https:// and a trailing slash', mod.resolveAccessConfig({teamDomain: `https://${TEAM_DOMAIN}/`, aud: AUD})?.teamDomain === TEAM_DOMAIN)
    check('resolveAccessConfig rejects a missing aud', mod.resolveAccessConfig({teamDomain: TEAM_DOMAIN, aud: ''}) === null)
    check('resolveAccessConfig rejects a missing team domain', mod.resolveAccessConfig({teamDomain: '', aud: AUD}) === null)
    check('resolveAccessConfig rejects a team domain with a path', mod.resolveAccessConfig({teamDomain: `${TEAM_DOMAIN}/x`, aud: AUD}) === null)
    check('resolveAccessConfig rejects undefined', mod.resolveAccessConfig(undefined) === null)

    const sign = (payload, key = privateKey, kid = 'k1') => new SignJWT(payload).setProtectedHeader({alg: 'RS256', kid}).sign(key)
    const now = Math.floor(Date.now() / 1000)
    const cases = [
        ['valid token', await sign(claims()), true],
        ['valid token with a string aud', await sign(claims({aud: AUD})), true],
        ['wrong aud', await sign(claims({aud: ['someone-else']})), false],
        ['wrong iss', await sign(claims({iss: 'https://evil.cloudflareaccess.com'})), false],
        ['iss without https', await sign(claims({iss: TEAM_DOMAIN})), false],
        ['expired', await sign(claims({iat: now - 7200, exp: now - 3600})), false],
        ['no exp', await sign(claims({exp: undefined})), false],
        ['signed by another key', await sign(claims(), otherKey), false],
        ['alg:none', unsignedJwt(claims()), false],
        ['HS256', hs256Jwt(claims(), AUD), false],
        ['garbage', 'not-a-jwt', false],
        ['empty', '', false]
    ]
    for (const [name, token, expected] of cases) {
        const ok = await mod.verifyAccessJwt(token, config, jwks)
        check(`verifyAccessJwt: ${name} -> ${expected ? 'accepted' : 'rejected'}`, ok === expected, `got ${ok}`)
    }
}

async function main() {
    await pathChecks()
    await unitChecks()
    if (process.argv.includes('--unit-only')) return finish()

    let built
    try {
        built = JSON.parse(await readFile(join(SERVER_DIR, 'wrangler.json'), 'utf8'))
    } catch {
        console.error('No .output/server/wrangler.json. Build first: NITRO_PRESET=cloudflare_module npm run build')
        process.exit(2)
    }
    // Never touch the real D1 database from a local check.
    for (const db of built.d1_databases || []) delete db.remote
    for (const kv of built.kv_namespaces || []) delete kv.remote
    const wranglerConfig = join(SERVER_DIR, 'wrangler.guard.json')
    await writeFile(wranglerConfig, JSON.stringify(built, null, 2))

    const tmp = await mkdtemp(join(tmpdir(), 'studio-guard-'))
    try {
        await liveChecks(tmp, wranglerConfig)
    } finally {
        await rm(tmp, {recursive: true, force: true})
        await rm(wranglerConfig, {force: true})
    }
    finish()
}

function finish() {
    console.log(`\n${failures === 0 ? 'All checks passed.' : `${failures} check(s) failed.`}`)
    console.log('Not tested: a real Cloudflare Access JWT verified against the live team JWKS (cannot be made locally).')
    process.exit(failures === 0 ? 0 : 1)
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
