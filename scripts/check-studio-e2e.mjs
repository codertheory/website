#!/usr/bin/env node
// End-to-end checks of the built Worker in workerd (Miniflare), for the parts
// of the admin-host guard that need a passing Access token and a Studio
// session: the image proxy, component meta and the Access team-domain pin.
// Every outbound fetch is answered here: a fake Access JWKS, a fake GitHub
// login and a fake attacker host. KV and D1 are in memory, and the ASSETS
// binding serves .output/public as it does in production. Nothing leaves the
// machine.
//
// A fetch from the Worker to its own admin host gets a 522, because that is
// what a Worker gets when it fetches its own Custom Domain in production (or
// the Access login page). Image previews must come from ASSETS instead.
//
// Build first:  NITRO_PRESET=cloudflare_module npm run build
// Then run:     node scripts/check-studio-e2e.mjs
//
// Adapted from the reviewer's harness on PR #7.
import { readFile, readdir } from 'node:fs/promises'
import { request } from 'node:http'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Miniflare, Response as MfResponse } from 'miniflare'
import { SignJWT, exportJWK, generateKeyPair } from 'jose'
import { IPX_ALLOWED, IPX_MISSING, IPX_REFUSED } from './studio-ipx-cases.mjs'

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
const IPX_CACHE = 'private, max-age=300'

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
            if (url.host === ADMIN) return new MfResponse('error code: 522', {status: 522})
            return new MfResponse('blocked by test harness', {status: 599})
        }
    })
    const base = await mf.ready
    // Raw http so the Host header reaches the Worker as written (fetch drops it).
    const call = (host, path, headers = {}, method = 'GET') => new Promise((done, fail) => {
        const req = request({host: base.hostname, port: base.port, path, method, headers: {'host': host, 'x-forwarded-proto': 'https', ...headers}}, (res) => {
            const chunks = []
            res.on('data', d => chunks.push(d))
            // body is a Buffer; .includes() and .equals() work on it.
            res.on('end', () => done({status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks)}))
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

        // Outbound fetches made while one request was answered, leaving out the
        // Access key set (jose may refresh it at any time; it is not Studio).
        const outboundDuring = async (fn) => {
            const before = outbound.length
            const res = await fn()
            return {res, out: outbound.slice(before).filter(u => u.pathname !== '/cdn-cgi/access/certs')}
        }
        const ipxHeaders = res => res.headers['content-security-policy'] === IPX_CSP && res.headers['x-content-type-options'] === 'nosniff'
        const headerDetail = res => `csp=${res.headers['content-security-policy']} xcto=${res.headers['x-content-type-options']} cache=${res.headers['cache-control']}`

        console.log('\n-- Studio image proxy: local images, served from ASSETS')
        for (const [path, file, type] of IPX_ALLOWED) {
            const {res, out} = await outboundDuring(() => call(ADMIN, path, withSession))
            const disk = await readFile(join(PUBLIC_DIR, file))
            check(`ipx ${path} -> 200 ${type}, same bytes as .output/public/${file}`,
                res.status === 200 && res.headers['content-type'] === type && res.body.equals(disk),
                `got ${res.status} ${res.headers['content-type']} ${res.body.length} bytes`)
            check(`ipx ${path} has the sandbox CSP, nosniff and private cache`, ipxHeaders(res) && res.headers['cache-control'] === IPX_CACHE, headerDetail(res))
            check(`ipx ${path} made no outbound fetch`, out.length === 0, out.map(u => u.href).join(' '))
        }
        for (const [path] of IPX_MISSING) {
            const {res, out} = await outboundDuring(() => call(ADMIN, path, withSession))
            check(`ipx ${path} (not in ASSETS) -> 404, no outbound fetch`, res.status === 404 && out.length === 0, `got ${res.status}; ${out.map(u => u.href).join(' ')}`)
        }
        const {res: noSession, out: noSessionOut} = await outboundDuring(() => call(ADMIN, '/__nuxt_studio/ipx/_/favicon.svg', jwt))
        check('ipx local image with an Access token and no Studio session -> 200 (public file, behind Access)', noSession.status === 200 && noSessionOut.length === 0, `got ${noSession.status}`)
        const ipxNoToken = await call(ADMIN, '/__nuxt_studio/ipx/_/favicon.svg', {cookie: session ?? ''})
        check('ipx local image with a Studio session and no Access token -> 403', ipxNoToken.status === 403, `got ${ipxNoToken.status}`)
        const {res: head} = await outboundDuring(() => call(ADMIN, '/__nuxt_studio/ipx/_/favicon.svg', withSession, 'HEAD'))
        check('ipx HEAD local image -> 200', head.status === 200, `got ${head.status}`)
        const {res: post, out: postOut} = await outboundDuring(() => call(ADMIN, '/__nuxt_studio/ipx/_/favicon.svg', withSession, 'POST'))
        check('ipx POST -> 404, no outbound fetch', post.status === 404 && postOut.length === 0, `got ${post.status}`)

        console.log('\n-- Studio image proxy: everything else is 404 with no outbound fetch')
        for (const path of IPX_REFUSED) {
            const {res, out} = await outboundDuring(() => call(ADMIN, path, withSession))
            // The Worker entry parses the URL first, which resolves `./`, so
            // `_/./favicon.svg` arrives as `_/favicon.svg`. Not a bypass.
            const parsed = new URL(path, 'https://url.invalid')
            const resolved = parsed.pathname + parsed.search
            if (resolved !== path && IPX_ALLOWED.some(([allowed]) => allowed === resolved)) {
                check(`ipx ${path} arrives as ${resolved} -> 200, no outbound fetch`, res.status === 200 && out.length === 0, `got ${res.status}`)
                continue
            }
            check(`ipx ${path} -> 404, no outbound fetch`,
                res.status === 404 && out.length === 0 && !res.body.includes('/*attacker*/'),
                `got ${res.status}; outbound: ${out.map(u => u.href).join(' ') || '-'}`)
            if (path.startsWith('/__nuxt_studio/ipx')) check(`ipx ${path} 404 has the sandbox CSP and nosniff`, ipxHeaders(res), headerDetail(res))
        }

        const pubIpx = await call(PUBLIC, '/__nuxt_studio/ipx/_/https://evil.example/x.svg', {cookie: session ?? ''})
        check('public ipx with a session cookie -> 404', pubIpx.status === 404, `got ${pubIpx.status}`)

        console.log('\n-- Component meta')
        const metaPublic = await call(PUBLIC, '/api/component-meta')
        check('public /api/component-meta -> 404', metaPublic.status === 404, `got ${metaPublic.status}`)
        const metaJson = await call(PUBLIC, '/api/component-meta.json')
        check('public /api/component-meta.json -> 404', metaJson.status === 404, `got ${metaJson.status}`)
        const metaNoToken = await call(ADMIN, '/api/component-meta')
        check('admin /api/component-meta with no token -> 403', metaNoToken.status === 403, `got ${metaNoToken.status}`)
        for (const path of ['/api/component-meta', '/api/component-meta.json', '/api/component-meta/ProseA', '/api/component-meta%2FProseA', '/api//component-meta']) {
            const res = await call(ADMIN, path, withSession)
            check(`admin ${path} with token and session -> 404`, res.status === 404, `got ${res.status}`)
        }
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
