#!/usr/bin/env node
// End-to-end checks of the built Worker in workerd (Miniflare), for the parts
// of the admin-host guard that need a passing Access token and a Studio
// session: the image proxy and the Access team-domain pin. Every outbound
// fetch is answered here: a fake Access JWKS, a fake GitHub login and a fake
// attacker host. KV and D1 are in memory. Nothing leaves the machine.
//
// Build first:  NITRO_PRESET=cloudflare_module npm run build
// Then run:     node scripts/check-studio-e2e.mjs
//
// Adapted from the reviewer's harness on PR #7.
import { readFile, readdir } from 'node:fs/promises'
import { request } from 'node:http'
import { join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Miniflare, Response as MfResponse } from 'miniflare'
import { SignJWT, exportJWK, generateKeyPair } from 'jose'

const ROOT = resolve(fileURLToPath(import.meta.url), '../..')
const SERVER_DIR = join(ROOT, '.output/server')
const PUBLIC_DIR = join(ROOT, '.output/public')
const ADMIN = 'admin.codertheory.dev'
const PUBLIC = 'codertheory.dev'
const TEAM = 'e2e-team.cloudflareaccess.com'
const AUD = 'e2e-aud'
const MODERATOR = 'moderator@example.invalid'
const ATTACKER_BODY = '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(document.domain)"><script>/*attacker*/</script></svg>'
const IPX_CSP = "default-src 'none'; sandbox"

let failures = 0
function check(name, ok, detail = '') {
    if (!ok) failures++
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`)
}

async function walk(dir) {
    const files = []
    for (const e of await readdir(dir, {withFileTypes: true})) {
        const p = join(dir, e.name)
        if (e.isDirectory()) files.push(...await walk(p))
        else if (e.name.endsWith('.mjs')) files.push(p)
    }
    return files
}

const {publicKey, privateKey} = await generateKeyPair('RS256')
const jwk = {...await exportJWK(publicKey), kid: 'k1', alg: 'RS256', use: 'sig'}
const sign = payload => new SignJWT(payload).setProtectedHeader({alg: 'RS256', kid: 'k1'}).sign(privateKey)
function claims(team, overrides = {}) {
    const now = Math.floor(Date.now() / 1000)
    return {aud: [AUD], iss: `https://${team}`, sub: 'u1', email: 'owner@example.invalid', type: 'app', iat: now, nbf: now, exp: now + 600, ...overrides}
}

// Serves the built public files for the image proxy's same-origin fetch.
async function publicFile(pathname) {
    const file = normalize(join(PUBLIC_DIR, decodeURIComponent(pathname)))
    if (!file.startsWith(`${PUBLIC_DIR}/`)) return null
    try {
        return await readFile(file)
    } catch {
        return null
    }
}

async function startWorker(team) {
    const outbound = []
    const entry = join(SERVER_DIR, 'index.mjs')
    const modules = [entry, ...(await walk(SERVER_DIR)).filter(f => f !== entry)].map(path => ({type: 'ESModule', path}))
    const mf = new Miniflare({
        modules,
        modulesRoot: SERVER_DIR,
        compatibilityDate: '2025-07-09',
        compatibilityFlags: ['nodejs_compat', 'no_nodejs_compat_v2'],
        kvNamespaces: ['STATS'],
        d1Databases: ['DB'],
        assets: {directory: PUBLIC_DIR, binding: 'ASSETS', routerConfig: {has_user_worker: true}},
        bindings: {
            NUXT_STUDIO_AUTH_GITHUB_CLIENT_ID: 'dummy-client-id',
            NUXT_STUDIO_AUTH_GITHUB_CLIENT_SECRET: 'dummy-client-secret',
            NUXT_STUDIO_AUTH_GITHUB_MODERATORS: MODERATOR,
            NUXT_STUDIO_AUTH_SESSION_SECRET: 'dummy-session-secret-0123456789abcdef',
            NUXT_ACCESS_TEAM_DOMAIN: team,
            NUXT_ACCESS_AUD: AUD
        },
        async outboundService(req) {
            const url = new URL(req.url)
            outbound.push(url)
            if (url.pathname === '/cdn-cgi/access/certs') return MfResponse.json({keys: [jwk]})
            if (url.href === 'https://github.com/login/oauth/access_token') return MfResponse.json({access_token: 'gho_FAKE', token_type: 'bearer', scope: 'public_repo,user:email'})
            if (url.href === 'https://api.github.com/user') return MfResponse.json({id: 1, login: 'mock', name: 'Mock', avatar_url: '', email: MODERATOR})
            if (url.host === 'evil.example') return new MfResponse(ATTACKER_BODY, {headers: {'content-type': 'text/plain'}})
            if (url.host === ADMIN) {
                const body = await publicFile(url.pathname)
                return body ? new MfResponse(body) : new MfResponse('not found', {status: 404})
            }
            return new MfResponse('blocked by test harness', {status: 599})
        }
    })
    const base = await mf.ready
    // Raw http so the Host header reaches the Worker as written (fetch drops it).
    const call = (host, path, headers = {}) => new Promise((done, fail) => {
        const req = request({host: base.hostname, port: base.port, path, method: 'GET', headers: {'host': host, 'x-forwarded-proto': 'https', ...headers}}, (res) => {
            const chunks = []
            res.on('data', d => chunks.push(d))
            res.on('end', () => done({status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8')}))
        })
        req.on('error', fail)
        req.setTimeout(30000, () => req.destroy(new Error('timeout')))
        req.end()
    })
    return {mf, call, outbound}
}

const cookiesFrom = res => [res.headers['set-cookie'] ?? []].flat().map(c => c.split(';')[0])

async function mainInstance() {
    console.log(`\n-- Miniflare, Access team ${TEAM}`)
    const {mf, call, outbound} = await startWorker(TEAM)
    try {
        const jwt = {'cf-access-jwt-assertion': await sign(claims(TEAM))}

        const noToken = await call(ADMIN, '/contact')
        check('admin /contact with no token -> 403', noToken.status === 403, `got ${noToken.status}`)
        const ok = await call(ADMIN, '/contact', jwt)
        check('admin /contact with a valid token -> 200', ok.status === 200, `got ${ok.status}`)
        const now = Math.floor(Date.now() / 1000)
        const skew = await call(ADMIN, '/contact', {'cf-access-jwt-assertion': await sign(claims(TEAM, {nbf: now + 2}))})
        check('admin /contact with nbf 2 s ahead -> 200 (clock tolerance)', skew.status === 200, `got ${skew.status}`)
        const future = await call(ADMIN, '/contact', {'cf-access-jwt-assertion': await sign(claims(TEAM, {nbf: now + 120}))})
        check('admin /contact with nbf 120 s ahead -> 403', future.status === 403, `got ${future.status}`)

        // Studio login with GitHub mocked, to get a real session cookie.
        const entry = await call(ADMIN, '/_studio', jwt)
        const start = await call(ADMIN, '/__nuxt_studio/auth/github', jwt)
        const stateCookie = cookiesFrom(start).find(c => c.startsWith('studio-oauth-state='))
        const state = stateCookie ? decodeURIComponent(stateCookie.split('=')[1]) : ''
        const redirectCookie = cookiesFrom(entry).find(c => c.startsWith('studio-redirect=')) ?? ''
        const cb = await call(ADMIN, `/__nuxt_studio/auth/github?code=c&state=${encodeURIComponent(state)}`, {...jwt, cookie: [stateCookie, redirectCookie].filter(Boolean).join('; ')})
        const session = cookiesFrom(cb).find(c => c.startsWith('studio-session='))
        check('Studio login with a moderator sets a session cookie', Boolean(session), `callback ${cb.status}`)
        const withSession = {...jwt, cookie: session ?? ''}

        console.log('\n-- Studio image proxy, Access token and Studio session')
        const external = [
            '/__nuxt_studio/ipx/_/https://evil.example/x.svg',
            '/__nuxt_studio/ipx/_/https%3A%2F%2Fevil.example%2Fx.svg',
            '/__nuxt_studio/ipx/_/https%253A%252F%252Fevil.example%252Fx.svg',
            '/__nuxt_studio/ipx/_/https:/evil.example/x.svg',
            '/__nuxt_studio/ipx/_/HTTPS://evil.example/x.svg',
            '/__nuxt_studio/ipx/_/https://evil.example/x.html',
            '/__nuxt_studio/ipx/s_200x200,fit_cover/https://evil.example/x.png',
            '/__nuxt_studio/ipx/_/%20https://evil.example/x.svg',
            '/__nuxt_studio/ipx/_///evil.example/x.svg',
            '/__nuxt_studio/ipx/_/%5C%5Cevil.example/x.svg'
        ]
        for (const path of external) {
            const before = outbound.length
            const res = await call(ADMIN, path, withSession)
            const fetchedEvil = outbound.slice(before).some(u => u.host === 'evil.example')
            check(`ipx ${path} -> refused (400/404), nothing fetched from evil.example`,
                (res.status === 400 || res.status === 404) && !fetchedEvil && !res.body.includes('/*attacker*/'),
                `got ${res.status}, fetched evil.example: ${fetchedEvil}`)
            check(`ipx ${path} response has the sandbox CSP and nosniff`,
                res.headers['content-security-policy'] === IPX_CSP && res.headers['x-content-type-options'] === 'nosniff',
                `csp=${res.headers['content-security-policy']} xcto=${res.headers['x-content-type-options']}`)
        }

        const svg = await call(ADMIN, '/__nuxt_studio/ipx/_/favicon.svg', withSession)
        check('ipx local /favicon.svg -> 200 svg', svg.status === 200 && svg.body.trimStart().startsWith('<svg'), `got ${svg.status} ${svg.headers['content-type']}`)
        check('ipx local /favicon.svg has the sandbox CSP and nosniff',
            svg.headers['content-security-policy'] === IPX_CSP && svg.headers['x-content-type-options'] === 'nosniff',
            `csp=${svg.headers['content-security-policy']} xcto=${svg.headers['x-content-type-options']}`)
        const png = await call(ADMIN, '/__nuxt_studio/ipx/s_200x200,fit_cover/icon-192.png', withSession)
        check('ipx local /icon-192.png with modifiers -> 200 image', png.status === 200 && /^image\//.test(String(png.headers['content-type'])), `got ${png.status} ${png.headers['content-type']}`)
        check('ipx local /icon-192.png has the sandbox CSP and nosniff',
            png.headers['content-security-policy'] === IPX_CSP && png.headers['x-content-type-options'] === 'nosniff',
            `csp=${png.headers['content-security-policy']} xcto=${png.headers['x-content-type-options']}`)

        const noSession = await call(ADMIN, '/__nuxt_studio/ipx/_/favicon.svg', jwt)
        check('ipx local image without a Studio session -> 404 (Studio auth)', noSession.status === 404, `got ${noSession.status}`)
        const pubIpx = await call(PUBLIC, '/__nuxt_studio/ipx/_/https://evil.example/x.svg', {cookie: session ?? ''})
        check('public ipx with a session cookie -> 404', pubIpx.status === 404, `got ${pubIpx.status}`)

        console.log('\n-- Component meta')
        const metaPublic = await call(PUBLIC, '/api/component-meta')
        check('public /api/component-meta -> 404', metaPublic.status === 404, `got ${metaPublic.status}`)
        const metaJson = await call(PUBLIC, '/api/component-meta.json')
        check('public /api/component-meta.json -> 404', metaJson.status === 404, `got ${metaJson.status}`)
        const metaNoToken = await call(ADMIN, '/api/component-meta')
        check('admin /api/component-meta with no token -> 403', metaNoToken.status === 403, `got ${metaNoToken.status}`)
        const studioMeta = await call(ADMIN, '/__nuxt_studio/meta', withSession)
        check('admin /__nuxt_studio/meta with token and session -> 200 (what the editor reads)', studioMeta.status === 200, `got ${studioMeta.status}`)
    } finally {
        await mf.dispose()
    }
}

// A team domain outside cloudflareaccess.com is treated as missing config,
// even when that host serves a key set that signed the token.
async function evilTeamInstance() {
    console.log('\n-- Miniflare, Access team domain evil.example')
    const {mf, call, outbound} = await startWorker('evil.example')
    try {
        const res = await call(ADMIN, '/contact', {'cf-access-jwt-assertion': await sign(claims('evil.example'))})
        check('admin /contact, team domain evil.example, token signed by its keys -> 403', res.status === 403, `got ${res.status}`)
        check('no key set fetched from evil.example', !outbound.some(u => u.host === 'evil.example'), outbound.map(u => u.href).join(' '))
    } finally {
        await mf.dispose()
    }
}

try {
    await readFile(join(SERVER_DIR, 'index.mjs'))
} catch {
    console.error('No .output/server/index.mjs. Build first: NITRO_PRESET=cloudflare_module npm run build')
    process.exit(2)
}
await mainInstance()
await evilTeamInstance()
console.log(`\n${failures === 0 ? 'All checks passed.' : `${failures} check(s) failed.`}`)
process.exit(failures === 0 ? 0 : 1)
