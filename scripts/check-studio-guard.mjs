#!/usr/bin/env node
// Checks the admin-host guard (server/middleware/studio-host.ts) against a
// local `wrangler dev` of the Cloudflare build, plus the Access JWT verifier
// (server/utils/access-jwt.ts) directly in Node.
//
// Build first:  NITRO_PRESET=cloudflare_module npm run build
// Then run:     node scripts/check-studio-guard.mjs
//
// Everything here uses dummy values only. The wrangler config is copied with
// D1 `remote: true` stripped and run with --local, and the env files are
// written to a temp directory, never into the repo. The one request that
// leaves the machine is a JWKS fetch to the made-up team
// guard-test.cloudflareaccess.com, made when an RS256 token from an unknown
// key is checked; it finds no key and the token is refused.
//
// The image proxy and Studio-session checks need outbound fetches mocked, so
// they live in scripts/check-studio-e2e.mjs (Miniflare).
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
import { IPX_ALLOWED, IPX_MISSING, IPX_REFUSED } from './studio-ipx-cases.mjs'

const ROOT = resolve(fileURLToPath(import.meta.url), '../..')
const SERVER_DIR = join(ROOT, '.output/server')
const ADMIN_HOST = 'admin.codertheory.dev'
const PUBLIC_HOST = 'codertheory.dev'
const TEAM_DOMAIN = 'guard-test.cloudflareaccess.com'
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
    '/__nuxt_studio/auth/access',
    '/__nuxt_studio/auth/access?redirect=/about',
    '/__nuxt_studio/auth/access/',
    '/__NUXT_STUDIO/auth/access',
    '/__nuxt_studio/AUTH/ACCESS',
    '/__nuxt_studio/auth/%61ccess',
    '/__nuxt_studio/auth/%2561ccess',
    '/__nuxt_studio/auth%2Faccess',
    '/__nuxt_studio%2Fauth%2Faccess',
    '/%5F%5Fnuxt_studio/auth/access',
    '//__nuxt_studio//auth//access',
    '/__nuxt_studio\\auth\\access',
    '/__nuxt_studio/auth/access;x',
    '/__nuxt_studio/auth/github',
    '/__nuxt_studio/auth/gitlab',
    '/__nuxt_studio/auth/google',
    '/__nuxt_studio/auth/sso',
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
    '/SW.JS',
    // nuxt-component-meta's routes, added by @nuxt/content when nuxt-studio is
    // installed. Studio's editor reads /__nuxt_studio/meta instead.
    '/api/component-meta',
    '/api/component-meta.json',
    '/api/component-meta/ProseA',
    '/API/Component-Meta',
    '/api/component-meta%2FProseA',
    '//api//component-meta'
]

async function liveChecks(tmp, wranglerConfig) {
    const fullEnv = join(tmp, 'full.env')
    const noAccessEnv = join(tmp, 'no-access.env')
    // The Studio secrets from #12, all dummies.
    const studioVars = [
        'NUXT_STUDIO_GIT_GITHUB_TOKEN=github_pat_GUARD_FAKE_TOKEN',
        'NUXT_STUDIO_EDITOR_EMAIL=guard@example.invalid',
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

        for (const path of ['/_studio', '/__nuxt_studio/auth/session', '/__nuxt_studio/auth/access', '/__nuxt_studio/auth/github', '/sw.js', '/api/component-meta', '/api/component-meta.json', '/about', '/projects/rolesmith', '/sitemap.xml', '/api/__sitemap__/urls']) {
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
        for (const path of ['/', '/_studio', '/__nuxt_studio/auth/session', '/__nuxt_studio/auth/access']) {
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

// event.path as h3 1.15 gives it to middleware, for a raw request path. The
// path goes in on a bare request object, because Request() would normalise it.
async function h3DecodedPath() {
    const {createApp, createEvent, eventHandler} = await import('h3')
    const app = createApp()
    let seen = ''
    app.use(eventHandler((event) => {
        seen = event.path
        return null
    }))
    return async (path) => {
        seen = ''
        const req = {url: path, method: 'GET', headers: {}}
        const res = {statusCode: 200, headersSent: false, writableEnded: false, setHeader() {}, getHeader() {}, removeHeader() {}, end() {}}
        await Promise.resolve(app.handler(createEvent(req, res))).catch(() => {})
        return seen
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
    const notStudio = ['/', '/about', '/studio', '/blog/_studio-notes', '/projects/rolesmith', '/sw.json', '/%E0%A4%A', '/_nuxt/builds/latest.json', '/api/__sitemap__/urls', '/api/contact', '/api/stats/github', '/api/component']
    for (const path of notStudio) check(`isStudioPath(${JSON.stringify(path)}) -> false`, mod.isStudioPath(path) === false)

    // Studio's image proxy. On the admin host the middleware answers every
    // /__nuxt_studio/ipx request itself, from the raw URL, and serves only
    // allow-listed local images. Each case is fed as it arrives on the wire
    // (event.node.req.originalUrl) and as h3 hands it to middleware
    // (event.path, decoded once), so a check on the wrong one shows up here.
    const h3Path = await h3DecodedPath()
    const ipxPaths = ['/__nuxt_studio/ipx/_/favicon.svg', '/__NUXT_STUDIO/IPX/_/favicon.svg', '/__nuxt_studio/ipx', '/__nuxt_studio/ipx/s_200x200,fit_cover/shots/x.png', '/__nuxt_studio%2Fipx/_/x.png', '//__nuxt_studio//ipx/_/x.png', '/__nuxt_studio/ipx#/x']
    for (const path of ipxPaths) check(`isStudioIpxPath(${JSON.stringify(path)}) -> true`, mod.isStudioIpxPath?.(path) === true)
    for (const path of ['/_studio', '/__nuxt_studio/meta', '/favicon.svg', '/__nuxt_studio/ip']) check(`isStudioIpxPath(${JSON.stringify(path)}) -> false`, mod.isStudioIpxPath?.(path) === false)
    for (const [path, id] of [...IPX_ALLOWED, ...IPX_MISSING]) {
        check(`studioIpxAssetId(raw ${JSON.stringify(path)}) -> ${JSON.stringify(id)}`, mod.studioIpxAssetId?.(path) === id, `got ${JSON.stringify(mod.studioIpxAssetId?.(path))}`)
    }
    for (const path of IPX_REFUSED) {
        const decoded = await h3Path(path)
        check(`studioIpxAssetId(raw ${JSON.stringify(path)}) -> null`, mod.studioIpxAssetId?.(path) === null, `got ${JSON.stringify(mod.studioIpxAssetId?.(path))}`)
        // A few decode to a plain allowed path (%66avicon.svg), which is fine
        // to serve; the rest must still be refused after one decode.
        const wantDecoded = IPX_ALLOWED.find(([allowed]) => allowed === decoded)?.[1] ?? null
        check(`studioIpxAssetId(h3-decoded ${JSON.stringify(decoded)}) -> ${JSON.stringify(wantDecoded)}`, mod.studioIpxAssetId?.(decoded) === wantDecoded, `got ${JSON.stringify(mod.studioIpxAssetId?.(decoded))}`)
        if (path.startsWith('/__nuxt_studio')) {
            check(`isStudioIpxPath(raw ${JSON.stringify(path)}) or (h3-decoded) -> true`, mod.isStudioIpxPath?.(path) === true || mod.isStudioIpxPath?.(decoded) === true)
        }
    }
    for (const bad of [undefined, null, '', 42]) check(`studioIpxAssetId(${JSON.stringify(bad)}) -> null`, mod.studioIpxAssetId?.(bad) === null)

    // nuxt-component-meta's routes: 404 on every host, admin included.
    const meta = ['/api/component-meta', '/api/component-meta.json', '/api/component-meta/ProseA', '/API/Component-Meta', '/api/component-meta%2FProseA', '//api//component-meta', '/api/component-meta?x=1', '/api/%63omponent-meta']
    for (const path of meta) check(`isComponentMetaPath(${JSON.stringify(path)}) -> true`, mod.isComponentMetaPath?.(path) === true)
    for (const path of ['/api/component', '/api/contact', '/component-meta', '/__nuxt_studio/meta']) check(`isComponentMetaPath(${JSON.stringify(path)}) -> false`, mod.isComponentMetaPath?.(path) === false)

    // Studio's auth routes (#12): only the Access sign-in and the session
    // route stay open; GitHub, GitLab, Google, SSO and anything else under
    // /__nuxt_studio/auth is closed.
    const blockedAuth = ['/__nuxt_studio/auth/github', '/__nuxt_studio/auth/github/', '/__nuxt_studio/auth/github?code=c', '/__nuxt_studio/auth/gitlab', '/__nuxt_studio/auth/google', '/__nuxt_studio/auth/sso', '/__nuxt_studio/auth/GitHub', '/__nuxt_studio/auth/%67ithub', '/__nuxt_studio/auth%2Fgithub', '/__nuxt_studio//auth/github', '/__NUXT_STUDIO/AUTH/GITHUB', '/__nuxt_studio/auth', '/__nuxt_studio/auth/', '/__nuxt_studio/auth/session/../github', '/__nuxt_studio/auth/session;x', '/__nuxt_studio/auth/access/x', '/__nuxt_studio/auth/other',
        '/__nuxt_studio/auth\\github', '/__nuxt_studio\\auth\\github', '/__nuxt_studio/auth/%2567ithub', '/__nuxt_studio/auth%252Fgithub', '/__nuxt_studio/auth/./github',
        '/__nuxt_studio/auth/%2e/github', '/__nuxt_studio/auth/%2e%2e/github', '/__nuxt_studio/auth/access/../github', '/__nuxt_studio/auth/session/%2e%2e/github']
    for (const path of blockedAuth) check(`isBlockedStudioAuthPath(${JSON.stringify(path)}) -> true`, mod.isBlockedStudioAuthPath?.(path) === true)
    const openAuth = ['/__nuxt_studio/auth/session', '/__nuxt_studio/auth/session?x=1', '/__nuxt_studio/auth/access', '/__nuxt_studio/auth/access?redirect=/about', '/__nuxt_studio/meta', '/_studio', '/', '/about', '/auth/github']
    for (const path of openAuth) check(`isBlockedStudioAuthPath(${JSON.stringify(path)}) -> false`, mod.isBlockedStudioAuthPath?.(path) === false)

    // Studio's entry, which the admin host sends to the Access sign-in.
    for (const path of ['/_studio', '/_studio/', '/_studio?redirect=/about', '/_STUDIO', '/%5Fstudio', '//_studio', '/_studio/x']) check(`isStudioEntryPath(${JSON.stringify(path)}) -> true`, mod.isStudioEntryPath?.(path) === true)
    for (const path of ['/', '/studio', '/_studio-app/1.8.1/main.js', '/_studiox', '/__nuxt_studio/auth/access']) check(`isStudioEntryPath(${JSON.stringify(path)}) -> false`, mod.isStudioEntryPath?.(path) === false)

    // Studio's server routes, which the admin host answers with
    // Cache-Control: no-store (the image proxy sets its own).
    for (const path of ['/__nuxt_studio', '/__nuxt_studio/auth/session', '/__nuxt_studio/meta', '/__NUXT_STUDIO/meta', '/%5F%5Fnuxt_studio/meta', '//__nuxt_studio//meta', '/__nuxt_studio/ipx/_/favicon.svg']) check(`isStudioServerPath(${JSON.stringify(path)}) -> true`, mod.isStudioServerPath?.(path) === true)
    for (const path of ['/', '/about', '/_studio', '/sw.js', '/__nuxt', '/__nuxt_studiox', '/api/component-meta']) check(`isStudioServerPath(${JSON.stringify(path)}) -> false`, mod.isStudioServerPath?.(path) === false)

    // Where sign-in sends the browser: a same-origin path, or `/`.
    const redirects = [
        ['/about', '/about'], ['/blog/hello?x=1', '/blog/hello?x=1'], ['/projects/rolesmith', '/projects/rolesmith'],
        ['//evil.example', '/'], ['//evil.example/about', '/'], ['/\\evil.example', '/'], ['\\\\evil.example', '/'],
        ['/\t/evil.example', '/'], ['/\n/evil.example', '/'], ['/\r/evil.example', '/'], [' //evil.example', '/'],
        ['https://evil.example/', '/'], ['http:evil.example', '/'], ['javascript:alert(1)', '/'], ['evil.example', '/'],
        ['/_studio', '/'], ['/_studio?redirect=/about', '/'], ['/__nuxt_studio/auth/access', '/'], ['/__nuxt_studio/auth/github', '/'],
        ['', '/'], [undefined, '/'], [null, '/'], [42, '/'], [['/about'], '/'], [`/${'a'.repeat(3000)}`, '/']
    ]
    for (const [value, want] of redirects) check(`safeStudioRedirect(${JSON.stringify(value)?.slice(0, 40)}) -> ${want}`, mod.safeStudioRedirect?.(value) === want, `got ${JSON.stringify(mod.safeStudioRedirect?.(value))}`)
    for (const value of ['/%2F/evil.example', '/%5Cevil.example', '/%2e%2e//evil.example', '/.//evil.example', '/..//evil.example', '/./\\evil.example']) {
        const out = mod.safeStudioRedirect?.(value)
        const sameOrigin = typeof out === 'string' && out.startsWith('/') && !out.startsWith('//') && !out.startsWith('/\\') && new URL(out, 'https://admin.example.invalid').origin === 'https://admin.example.invalid'
        check(`safeStudioRedirect(${JSON.stringify(value)}) stays on the origin`, sameOrigin, `got ${JSON.stringify(out)}`)
    }
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
    // Only a Cloudflare Access team domain is trusted to serve the key set.
    const badTeams = ['evil.example', 'guard-test.invalid', `${TEAM_DOMAIN}.evil.example`, `a.${TEAM_DOMAIN}`, `${TEAM_DOMAIN}:443`, 'cloudflareaccess.com', '.cloudflareaccess.com', 'evil.example/.cloudflareaccess.com', 'user@x.cloudflareaccess.com']
    for (const teamDomain of badTeams) check(`resolveAccessConfig rejects team domain ${JSON.stringify(teamDomain)}`, mod.resolveAccessConfig({teamDomain, aud: AUD}) === null)
    check('resolveAccessConfig accepts an upper-case team domain', mod.resolveAccessConfig({teamDomain: ` HTTPS://${TEAM_DOMAIN.toUpperCase()}/ `, aud: AUD})?.teamDomain === TEAM_DOMAIN)

    const sign = (payload, key = privateKey, kid = 'k1') => new SignJWT(payload).setProtectedHeader({alg: 'RS256', kid}).sign(key)
    const now = Math.floor(Date.now() / 1000)
    const cases = [
        ['valid token', await sign(claims()), true],
        ['valid token with a string aud', await sign(claims({aud: AUD})), true],
        ['wrong aud', await sign(claims({aud: ['someone-else']})), false],
        ['wrong iss', await sign(claims({iss: 'https://evil.cloudflareaccess.com'})), false],
        ['iss without https', await sign(claims({iss: TEAM_DOMAIN})), false],
        ['expired', await sign(claims({iat: now - 7200, exp: now - 3600})), false],
        ['expired 60 s ago (beyond the 30 s tolerance)', await sign(claims({exp: now - 60})), false],
        ['expired 5 s ago (within the 30 s tolerance)', await sign(claims({exp: now - 5})), true],
        ['nbf 2 s ahead (clock skew)', await sign(claims({nbf: now + 2})), true],
        ['nbf 60 s ahead', await sign(claims({nbf: now + 60})), false],
        ['no exp', await sign(claims({exp: undefined})), false],
        ['signed by another key', await sign(claims(), otherKey), false],
        ['alg:none', unsignedJwt(claims()), false],
        ['HS256', hs256Jwt(claims(), AUD), false],
        ['garbage', 'not-a-jwt', false],
        ['empty', '', false]
    ]
    // verifyAccessJwt returns the verified claims, or null (#12).
    for (const [name, token, expected] of cases) {
        const payload = await mod.verifyAccessJwt(token, config, jwks)
        const shapeOk = expected ? (payload !== null && typeof payload === 'object') : payload === null
        check(`verifyAccessJwt: ${name} -> ${expected ? 'claims' : 'null'}`, shapeOk, `got ${JSON.stringify(payload)}`)
    }
    const verified = await mod.verifyAccessJwt(await sign(claims({email: 'Guard@Example.invalid'})), config, jwks)
    check('verifyAccessJwt returns the token\'s email claim as signed', verified?.email === 'Guard@Example.invalid', `got ${JSON.stringify(verified?.email)}`)

    // Editor match and session secret checks (#12), in Node.
    let auth
    try {
        auth = await import(pathToFileURL(join(ROOT, 'server/utils/studio-auth.ts')).href)
    } catch (error) {
        check('server/utils/studio-auth.ts loads', false, error.code || error.message)
        return
    }
    const editorCases = [
        ['guard@example.invalid', 'guard@example.invalid', true],
        ['Guard@Example.INVALID', ' guard@example.invalid ', true],
        [' guard@example.invalid\n', 'GUARD@example.invalid', true],
        ['other@example.invalid', 'guard@example.invalid', false],
        ['guard@example.invalid.evil.example', 'guard@example.invalid', false],
        ['xguard@example.invalid', 'guard@example.invalid', false],
        ['guard@example.invalid', '', false],
        ['guard@example.invalid', '   ', false],
        ['guard@example.invalid', undefined, false],
        ['', '', false],
        [undefined, undefined, false],
        [undefined, 'guard@example.invalid', false],
        [['guard@example.invalid'], 'guard@example.invalid', false],
        ['guard@example.invalid', 'guard@example.invalid,other@example.invalid', false],
        // ASCII only: no Unicode case folding, no Unicode trimming.
        ['lu\u212Ae@example.invalid', 'luke@example.invalid', false],
        ['LU\u212AE@EXAMPLE.INVALID', 'luke@example.invalid', false],
        ['luke@example.invalid', 'lu\u212Ae@example.invalid', false],
        ['lu\u212Ae@example.invalid', 'lu\u212Ae@example.invalid', false],
        ['\u00a0guard@example.invalid\u00a0', 'guard@example.invalid', false],
        ['guard@example.invalid\u200b', 'guard@example.invalid', false],
        ['guard@example.invalid\u0000', 'guard@example.invalid', false],
        ['gu ard@example.invalid', 'gu ard@example.invalid', false],
        ['g\u00fcard@example.invalid', 'g\u00fcard@example.invalid', false],
        ['\tGUARD@EXAMPLE.INVALID\r\n', 'guard@example.invalid', true]
    ]
    for (const [email, editor, want] of editorCases) check(`isEditorEmail(${JSON.stringify(email)}, ${JSON.stringify(editor)}) -> ${want}`, auth.isEditorEmail?.(email, editor) === want)
    const normaliseCases = [[' Guard@Example.INVALID ', 'guard@example.invalid'], ['lu\u212Ae@example.invalid', ''], ['\u00a0guard@example.invalid', ''], ['', ''], [42, '']]
    for (const [value, want] of normaliseCases) check(`normaliseEmail(${JSON.stringify(value)}) -> ${JSON.stringify(want)}`, auth.normaliseEmail?.(value) === want, `got ${JSON.stringify(auth.normaliseEmail?.(value))}`)

    // The commit author Studio writes (#12): both set and not blank, or null.
    const noreply = '13612932+LucasCoderT@users.noreply.github.com'
    const identityCases = [
        [['Lucas', noreply], {name: 'Lucas', email: noreply}],
        [[' Lucas ', ` ${noreply} `], {name: 'Lucas', email: noreply}],
        [['Lucas', 'someone@example.invalid'], {name: 'Lucas', email: 'someone@example.invalid'}],
        [['', noreply], null], [['   ', noreply], null], [[undefined, noreply], null], [[42, noreply], null],
        [['Lucas', ''], null], [['Lucas', '   '], null], [['Lucas', undefined], null], [['Lucas', 42], null]
    ]
    for (const [[name, email], want] of identityCases) {
        const got = auth.resolveStudioCommitIdentity?.(name, email)
        check(`resolveStudioCommitIdentity(${JSON.stringify(name)}, ${JSON.stringify(email)}) -> ${JSON.stringify(want)}`, JSON.stringify(got) === JSON.stringify(want), `got ${JSON.stringify(got)}`)
    }
    const secretCases = [['dummy-session-secret-0123456789abcdef', true], ['a'.repeat(32), true], ['a'.repeat(31), false], [`  ${'a'.repeat(30)}  `, false], ['', false], [undefined, false], [42, false]]
    for (const [secret, want] of secretCases) check(`isUsableSessionSecret(${JSON.stringify(secret)}) -> ${want}`, auth.isUsableSessionSecret?.(secret) === want)

    // Failure reasons go to console.warn, once per reason per isolate, with
    // no token in them. A fresh copy of the module stands in for a new isolate.
    const fresh = await import(`${pathToFileURL(join(ROOT, 'server/utils/access-jwt.ts')).href}?warn-check`)
    const warned = []
    const realWarn = console.warn
    console.warn = (...args) => warned.push(args.map(String).join(' '))
    const secretToken = await sign(claims({aud: ['someone-else']}))
    try {
        fresh.resolveAccessConfig({teamDomain: 'evil.example', aud: AUD})
        fresh.resolveAccessConfig({teamDomain: 'evil.example', aud: AUD})
        fresh.resolveAccessConfig({teamDomain: TEAM_DOMAIN, aud: ''})
        await fresh.verifyAccessJwt(secretToken, config, jwks)
        await fresh.verifyAccessJwt(secretToken, config, jwks)
        await fresh.verifyAccessJwt('', config, jwks)
        await fresh.verifyAccessJwt('', config, jwks)
        fresh.resolveAccessConfig({teamDomain: TEAM_DOMAIN, aud: AUD})
        await fresh.verifyAccessJwt(await sign(claims()), config, jwks)
    } finally {
        console.warn = realWarn
    }
    const count = re => warned.filter(w => re.test(w)).length
    check('warns once for a team domain outside cloudflareaccess.com', count(/\bteam-domain-invalid\b/) === 1, JSON.stringify(warned))
    check('warns once for a missing aud', count(/\baud-missing\b/) === 1, JSON.stringify(warned))
    check('warns once for a token with the wrong aud', count(/\bERR_JWT_CLAIM_VALIDATION_FAILED:aud\b/) === 1, JSON.stringify(warned))
    check('warns once for a missing token', count(/\bno-token\b/) === 1, JSON.stringify(warned))
    check('warns nothing for a good config and token', warned.length === 4, `${warned.length} warnings`)
    check('no warning contains the token', !warned.some(w => w.includes(secretToken) || w.includes(secretToken.split('.')[1])))
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

    // The Studio commit author (#12) is committed in wrangler.jsonc: the
    // owner's public GitHub noreply identity, and no other email address.
    console.log('\n-- Studio commit identity in the built wrangler config')
    const vars = built.vars ?? {}
    check('wrangler vars NUXT_STUDIO_COMMIT_NAME is Lucas', vars.NUXT_STUDIO_COMMIT_NAME === 'Lucas', `got ${JSON.stringify(vars.NUXT_STUDIO_COMMIT_NAME)}`)
    check('wrangler vars NUXT_STUDIO_COMMIT_EMAIL is the GitHub noreply address', vars.NUXT_STUDIO_COMMIT_EMAIL === '13612932+LucasCoderT@users.noreply.github.com', `got ${JSON.stringify(vars.NUXT_STUDIO_COMMIT_EMAIL)}`)
    const emails = Object.entries(vars).filter(([, value]) => String(value).includes('@'))
    check('no other wrangler var holds an email address', emails.length === 1 && emails[0][0] === 'NUXT_STUDIO_COMMIT_EMAIL', emails.map(([key]) => key).join(' '))
    check('no wrangler var sets NUXT_STUDIO_EDITOR_EMAIL (a secret)', !('NUXT_STUDIO_EDITOR_EMAIL' in vars))
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
