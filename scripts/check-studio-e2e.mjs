#!/usr/bin/env node
// End-to-end checks of the built Worker in workerd (Miniflare), for the parts
// of the admin-host guard that need a passing Access token and a Studio
// session: Studio sign-in through Access (#12), the session binding, the
// closed OAuth routes, the image proxy, component meta and the Access
// team-domain pin. Every outbound fetch is answered here: a fake Access JWKS
// and a fake attacker host; anything else (GitHub included) is refused and
// recorded. KV and D1 are in memory, and the ASSETS binding serves
// .output/public as it does in production. Nothing leaves the machine.
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
// Dummy values only. The editor email is configured with odd case and
// spaces, to check the match is trimmed and case-insensitive.
const EDITOR = 'editor@example.invalid'
const EDITOR_CONFIG = '  Editor@Example.INVALID '
const OTHER = 'other@example.invalid'
const GH_TOKEN = 'github_pat_E2E_FAKE_TOKEN'
const SESSION_SECRET = 'dummy-session-secret-0123456789abcdef'
const SIGN_IN = '/__nuxt_studio/auth/access'
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
    return {aud: [AUD], iss: `https://${team}`, sub: 'u1', email: EDITOR, type: 'app', iat: now, nbf: now, exp: now + 600, ...overrides}
}

// The Worker secrets the owner sets for Studio (#12). Each instance can add
// some or drop some through `overrides` (undefined drops one).
const STUDIO_BINDINGS = {
    NUXT_STUDIO_GIT_GITHUB_TOKEN: GH_TOKEN,
    NUXT_STUDIO_EDITOR_EMAIL: EDITOR_CONFIG,
    NUXT_STUDIO_AUTH_SESSION_SECRET: SESSION_SECRET
}

async function startWorker(team, overrides = {}) {
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
        bindings: Object.fromEntries(Object.entries({
            ...STUDIO_BINDINGS,
            NUXT_ACCESS_TEAM_DOMAIN: team,
            NUXT_ACCESS_AUD: AUD,
            ...overrides
        }).filter(([, value]) => value !== undefined)),
        async outboundService(req) {
            const url = new URL(req.url)
            outbound.push(url)
            if (url.pathname === '/cdn-cgi/access/certs') return MfResponse.json({keys: [jwk]})
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
const setCookieCount = res => [res.headers['set-cookie'] ?? []].flat().length
// A studio-session cookie with a value (a sealed session), not a deletion.
const sessionCookieFrom = res => cookiesFrom(res).find(c => /^studio-session=./.test(c))
const sessionCleared = res => cookiesFrom(res).includes('studio-session=')
const leaksToken = res => res.body.includes(GH_TOKEN)
function parseJson(res) {
    try {
        return JSON.parse(res.body.toString('utf8'))
    } catch {
        return null
    }
}

// Signs in through the Access route and returns the session cookie.
async function signIn(call, jwtHeaders, query = '') {
    const res = await call(ADMIN, `${SIGN_IN}${query}`, jwtHeaders)
    return {res, session: sessionCookieFrom(res)}
}

// The redirect target after sign-in must stay on the admin origin.
function sameOrigin(location) {
    if (typeof location !== 'string' || !location.startsWith('/') || location.startsWith('//') || location.startsWith('/\\')) return false
    try {
        return new URL(location, `https://${ADMIN}`).origin === `https://${ADMIN}`
    } catch {
        return false
    }
}

// Studio's GitHub, GitLab, Google and SSO login routes, in spellings that
// could reach them. Each must 404 on every host, with no outbound fetch.
const OAUTH_PATHS = [
    '/__nuxt_studio/auth/github',
    '/__nuxt_studio/auth/github?code=c&state=s',
    '/__nuxt_studio/auth/github/',
    '/__nuxt_studio/auth/gitlab',
    '/__nuxt_studio/auth/google',
    '/__nuxt_studio/auth/sso',
    '/__nuxt_studio/auth/GitHub',
    '/__nuxt_studio/auth/%67ithub',
    '/__nuxt_studio/auth%2Fgithub',
    '/__nuxt_studio//auth/github',
    '/__nuxt_studio/auth',
    '/__nuxt_studio/auth/'
]

async function mainInstance() {
    console.log(`\n-- Miniflare, Access team ${TEAM}`)
    const {mf, call, outbound} = await startWorker(TEAM)
    let keptSession
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
        check('admin /contact with a token and no Studio session sets no cookie', setCookieCount(ok) === 0, cookiesFrom(ok).join(' '))

        console.log('\n-- Studio sign-in through Access')
        const {res: signedIn, session} = await signIn(call, jwt)
        check('sign-in with the editor\'s Access token -> 302 to /', signedIn.status === 302 && signedIn.headers.location === '/', `got ${signedIn.status} ${signedIn.headers.location}`)
        check('sign-in sets a studio-session cookie', Boolean(session), cookiesFrom(signedIn).join(' '))
        check('sign-in sets studio-session-check=true (what the page reads)', cookiesFrom(signedIn).includes('studio-session-check=true'), cookiesFrom(signedIn).join(' '))
        check('sign-in response is not cached', /no-store/.test(String(signedIn.headers['cache-control'])), `cache-control=${signedIn.headers['cache-control']}`)
        const withSession = {...jwt, cookie: session ?? ''}
        const me = await call(ADMIN, '/__nuxt_studio/auth/session', withSession)
        const meBody = parseJson(me)
        check('/__nuxt_studio/auth/session then returns the editor', me.status === 200 && meBody?.user?.email === EDITOR, `got ${me.status} email=${meBody?.user?.email}`)
        check('the session holds the token from NUXT_STUDIO_GIT_GITHUB_TOKEN, provider github', meBody?.user?.accessToken === GH_TOKEN && meBody?.user?.provider === 'github', `provider=${meBody?.user?.provider}`)
        check('the session name falls back to the email (Access sends no name)', meBody?.user?.name === EDITOR, `name=${meBody?.user?.name}`)
        const upper = await signIn(call, {'cf-access-jwt-assertion': await sign(claims(TEAM, {email: ' EDITOR@example.INVALID '}))})
        check('sign-in with the editor email in other case and with spaces -> 302 and a session', upper.res.status === 302 && Boolean(upper.session), `got ${upper.res.status}`)

        const noJwt = await call(ADMIN, SIGN_IN)
        check('sign-in with no Access token -> 403, no Set-Cookie', noJwt.status === 403 && setCookieCount(noJwt) === 0, `got ${noJwt.status}, ${setCookieCount(noJwt)} cookies`)
        const wrongEmails = {
            'another email': OTHER,
            'the editor email with a suffix': `${EDITOR}.evil.example`,
            'the editor email with a prefix': `x${EDITOR}`,
            'an empty email': '',
            'no email claim (service token)': undefined,
            'an email that is not a string': [EDITOR]
        }
        for (const [name, email] of Object.entries(wrongEmails)) {
            const res = await call(ADMIN, SIGN_IN, {'cf-access-jwt-assertion': await sign(claims(TEAM, {email}))})
            check(`sign-in with ${name} -> 403, no Set-Cookie`, res.status === 403 && setCookieCount(res) === 0, `got ${res.status}, cookies: ${cookiesFrom(res).join(' ')}`)
        }
        const pubSignIn = await call(PUBLIC, SIGN_IN, jwt)
        check('public sign-in route with a valid token -> 404, no Set-Cookie', pubSignIn.status === 404 && setCookieCount(pubSignIn) === 0, `got ${pubSignIn.status}`)

        console.log('\n-- /_studio leads to the Access sign-in')
        const entry = await call(ADMIN, '/_studio', jwt)
        check('admin /_studio -> 302 to the sign-in route', entry.status === 302 && entry.headers.location === SIGN_IN, `got ${entry.status} ${entry.headers.location}`)
        const entryRedirect = await call(ADMIN, '/_studio?redirect=%2Fabout', jwt)
        check('admin /_studio?redirect=/about -> 302 to the sign-in route with the same redirect', entryRedirect.status === 302 && entryRedirect.headers.location === `${SIGN_IN}?redirect=%2Fabout`, `got ${entryRedirect.status} ${entryRedirect.headers.location}`)
        check('admin /_studio sets no cookie', setCookieCount(entry) === 0 && setCookieCount(entryRedirect) === 0, cookiesFrom(entry).concat(cookiesFrom(entryRedirect)).join(' '))
        const entryNoJwt = await call(ADMIN, '/_studio')
        check('admin /_studio with no Access token -> 403', entryNoJwt.status === 403, `got ${entryNoJwt.status}`)

        console.log('\n-- Sign-in redirect stays on the admin origin')
        const redirects = [
            ['/about', '/about'],
            ['/blog/hello?x=1', '/blog/hello?x=1'],
            ['//evil.example', '/'],
            ['//evil.example/about', '/'],
            ['/\\evil.example', '/'],
            ['\\\\evil.example', '/'],
            ['/\t/evil.example', '/'],
            ['/\n/evil.example', '/'],
            ['https://evil.example/', '/'],
            ['http:evil.example', '/'],
            ['javascript:alert(1)', '/'],
            ['evil.example', '/'],
            ['', '/'],
            ['/_studio', '/'],
            [SIGN_IN, '/']
        ]
        for (const [target, want] of redirects) {
            const {res} = await signIn(call, jwt, `?redirect=${encodeURIComponent(target)}`)
            check(`sign-in ?redirect=${JSON.stringify(target)} -> ${want}`, res.status === 302 && res.headers.location === want && sameOrigin(res.headers.location), `got ${res.status} ${JSON.stringify(res.headers.location)}`)
        }
        for (const query of ['?redirect=%2F.%2F%2Fevil.example', '?redirect=%2F%252e%252e%2F%2Fevil.example', '?redirect=%2F%2Fevil.example','?redirect=/a&redirect=//evil.example', '?redirect=%252F%252Fevil.example', '?redirect=/%5Cevil.example']) {
            const {res} = await signIn(call, jwt, query)
            check(`sign-in ${query} stays on the admin origin`, res.status === 302 && sameOrigin(res.headers.location), `got ${res.status} ${JSON.stringify(res.headers.location)}`)
        }
        const viaEntry = await call(ADMIN, '/_studio?redirect=%2F%2Fevil.example', jwt)
        const viaEntryNext = viaEntry.headers.location ? await call(ADMIN, viaEntry.headers.location, jwt) : null
        check('/_studio?redirect=//evil.example ends on the admin origin', viaEntryNext?.status === 302 && sameOrigin(viaEntryNext.headers.location), `got ${viaEntry.status} ${viaEntry.headers.location} then ${viaEntryNext?.status} ${viaEntryNext?.headers.location}`)

        console.log('\n-- Studio session bound to the Access identity')
        const sameEmail = await call(ADMIN, '/__nuxt_studio/auth/session', withSession)
        check('session with the same Access email is kept (no clearing cookie)', sameEmail.status === 200 && !sessionCleared(sameEmail) && parseJson(sameEmail)?.user?.email === EDITOR, `got ${sameEmail.status}`)
        const otherJwt = {'cf-access-jwt-assertion': await sign(claims(TEAM, {email: OTHER}))}
        const mismatch = await call(ADMIN, '/__nuxt_studio/auth/session', {...otherJwt, cookie: session ?? ''})
        check('session with another Access email -> session cleared (studio-session deleted)', sessionCleared(mismatch), cookiesFrom(mismatch).join(' ') || 'no Set-Cookie')
        check('session with another Access email -> studio-session-check deleted', cookiesFrom(mismatch).includes('studio-session-check='), cookiesFrom(mismatch).join(' '))
        check('session with another Access email -> no user and no token in the response', Boolean(session) && !leaksToken(mismatch) && !parseJson(mismatch)?.user, `got ${mismatch.status}`)
        const mismatchPage = await call(ADMIN, '/contact', {...otherJwt, cookie: session ?? ''})
        check('page request with another Access email and the old session -> session cleared', sessionCleared(mismatchPage), cookiesFrom(mismatchPage).join(' ') || 'no Set-Cookie')
        const mismatchHeader = await call(ADMIN, '/__nuxt_studio/auth/session', {...otherJwt, 'x-studio-session-session': (session ?? '').replace(/^studio-session=/, '')})
        check('session sent in the x-studio-session-session header with another Access email -> no user, no token', Boolean(session) && !leaksToken(mismatchHeader) && !parseJson(mismatchHeader)?.user, `got ${mismatchHeader.status}`)
        const noEmailJwt = {'cf-access-jwt-assertion': await sign(claims(TEAM, {email: undefined, common_name: 'service-token'}))}
        const noEmail = await call(ADMIN, '/__nuxt_studio/auth/session', {...noEmailJwt, cookie: session ?? ''})
        check('session with an Access token that has no email -> session cleared, no token', sessionCleared(noEmail) && !leaksToken(noEmail), `got ${noEmail.status}; ${cookiesFrom(noEmail).join(' ')}`)
        const metaMismatch = await call(ADMIN, '/__nuxt_studio/meta', {...otherJwt, cookie: session ?? ''})
        check('Studio API with another Access email and the old session -> not 200', Boolean(session) && metaMismatch.status !== 200, `got ${metaMismatch.status}`)

        console.log('\n-- Studio OAuth routes are gone')
        for (const path of OAUTH_PATHS) {
            const before = outbound.length
            const res = await call(ADMIN, path, withSession)
            const out = outbound.slice(before).filter(u => u.pathname !== '/cdn-cgi/access/certs')
            check(`admin ${path} with token and session -> 404, no outbound fetch`, res.status === 404 && out.length === 0, `got ${res.status}; ${out.map(u => u.href).join(' ')}`)
            const pub = await call(PUBLIC, path)
            check(`public ${path} -> 404`, pub.status === 404, `got ${pub.status}`)
        }

        console.log('\n-- Studio sign-out still works')
        const {session: toSignOut} = await signIn(call, jwt)
        const signOut = await call(ADMIN, '/__nuxt_studio/auth/session', {...jwt, cookie: toSignOut ?? ''}, 'DELETE')
        check('DELETE /__nuxt_studio/auth/session -> loggedOut, session cleared', signOut.status === 200 && parseJson(signOut)?.loggedOut === true && sessionCleared(signOut), `got ${signOut.status}`)

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
        keptSession = session
    } finally {
        await mf.dispose()
    }
    return keptSession
}

// Each Studio secret missing in turn: sign-in gives a 403 and no session. An
// existing session (sealed by the main instance with the same session
// secret) is cleared where the config no longer allows it.
async function missingConfigInstances(existingSession) {
    const variants = {
        'NUXT_STUDIO_EDITOR_EMAIL unset': {NUXT_STUDIO_EDITOR_EMAIL: undefined},
        'NUXT_STUDIO_EDITOR_EMAIL blank': {NUXT_STUDIO_EDITOR_EMAIL: '   '},
        'NUXT_STUDIO_GIT_GITHUB_TOKEN unset': {NUXT_STUDIO_GIT_GITHUB_TOKEN: undefined},
        'NUXT_STUDIO_GIT_GITHUB_TOKEN unset, STUDIO_GITHUB_TOKEN set': {NUXT_STUDIO_GIT_GITHUB_TOKEN: undefined, STUDIO_GITHUB_TOKEN: GH_TOKEN},
        'NUXT_STUDIO_AUTH_SESSION_SECRET unset': {NUXT_STUDIO_AUTH_SESSION_SECRET: undefined},
        'NUXT_STUDIO_AUTH_SESSION_SECRET shorter than 32 characters': {NUXT_STUDIO_AUTH_SESSION_SECRET: 'too-short'}
    }
    for (const [name, overrides] of Object.entries(variants)) {
        console.log(`\n-- Miniflare, ${name}`)
        const {mf, call} = await startWorker(TEAM, overrides)
        try {
            const jwt = {'cf-access-jwt-assertion': await sign(claims(TEAM))}
            const res = await call(ADMIN, SIGN_IN, jwt)
            check(`${name}: sign-in with the editor's token -> 403, no Set-Cookie`, res.status === 403 && setCookieCount(res) === 0, `got ${res.status}, cookies: ${cookiesFrom(res).join(' ')}`)
            const entry = await call(ADMIN, '/_studio', jwt)
            check(`${name}: /_studio still leads to the sign-in route, not an OAuth provider`, entry.status === 302 && entry.headers.location === SIGN_IN, `got ${entry.status} ${entry.headers.location}`)
            if (!('NUXT_STUDIO_GIT_GITHUB_TOKEN' in overrides)) {
                const old = await call(ADMIN, '/__nuxt_studio/auth/session', {...jwt, cookie: existingSession ?? ''})
                check(`${name}: an existing session is cleared and returns no token`, Boolean(existingSession) && sessionCleared(old) && !leaksToken(old), `got ${old.status}; ${cookiesFrom(old).join(' ') || 'no Set-Cookie'}`)
            }
        } finally {
            await mf.dispose()
        }
    }
}

// The GitHub OAuth secrets from #4 still set: /_studio must not send anyone
// to GitHub, and the OAuth routes stay 404 with nothing fetched.
async function leftoverOAuthInstance() {
    console.log('\n-- Miniflare, GitHub OAuth secrets still set')
    const {mf, call, outbound} = await startWorker(TEAM, {
        NUXT_STUDIO_AUTH_GITHUB_CLIENT_ID: 'dummy-client-id',
        NUXT_STUDIO_AUTH_GITHUB_CLIENT_SECRET: 'dummy-client-secret',
        NUXT_STUDIO_AUTH_GITHUB_MODERATORS: OTHER
    })
    try {
        const jwt = {'cf-access-jwt-assertion': await sign(claims(TEAM))}
        const entry = await call(ADMIN, '/_studio', jwt)
        check('leftover OAuth: /_studio -> 302 to the sign-in route', entry.status === 302 && entry.headers.location === SIGN_IN, `got ${entry.status} ${entry.headers.location}`)
        for (const path of ['/__nuxt_studio/auth/github', '/__nuxt_studio/auth/github?code=c&state=s']) {
            const res = await call(ADMIN, path, jwt)
            check(`leftover OAuth: admin ${path} -> 404`, res.status === 404, `got ${res.status} ${res.headers.location ?? ''}`)
        }
        const {res, session} = await signIn(call, jwt)
        check('leftover OAuth: Access sign-in still works', res.status === 302 && Boolean(session), `got ${res.status}`)
        check('leftover OAuth: nothing fetched from GitHub', !outbound.some(u => /github\.com$/.test(u.host)), outbound.map(u => u.href).join(' '))
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
const editorSession = await mainInstance()
await missingConfigInstances(editorSession)
await leftoverOAuthInstance()
await evilTeamInstance()
console.log(`\n${failures === 0 ? 'All checks passed.' : `${failures} check(s) failed.`}`)
process.exit(failures === 0 ? 0 : 1)
