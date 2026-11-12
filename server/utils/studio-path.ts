// Path and host matching for the Studio guard in server/middleware/studio-host.ts.
// Kept free of Nitro auto-imports so scripts/check-studio-guard.mjs can load
// it directly in Node.

// Studio's editor entry, its auth and API routes, and its draft-preview
// service worker. `/_studio` is a prefix on purpose, so it also covers
// `/_studio-app/*` if a request for it ever reaches the Worker.
//
// `/api/component-meta` (plus `.json` and `/:component`) comes from
// nuxt-component-meta, which @nuxt/content installs when nuxt-studio is
// present. It is unauthenticated with CORS `*`, and Studio's editor never
// calls it (it reads `/__nuxt_studio/meta`), so it is closed here too.
const STUDIO_PREFIXES = ['/_studio', '/__nuxt_studio', '/api/component-meta']
const STUDIO_EXACT = ['/sw.js']

// Brings a path to the most permissive spelling any router or proxy could
// treat it as: percent-decoded (repeatedly, to catch double encoding),
// backslashes as slashes, repeated slashes collapsed, lower case. Matching on
// this can only 404 more than the real router would, never less.
export function normaliseStudioPath(rawPath: string): string {
    let path = rawPath.split('?')[0]?.split('#')[0] ?? ''
    for (let i = 0; i < 3; i++) {
        let decoded: string
        try {
            decoded = decodeURIComponent(path)
        } catch {
            break
        }
        if (decoded === path) break
        path = decoded
    }
    return path.replace(/\\/g, '/').replace(/\/{2,}/g, '/').toLowerCase()
}

export function isStudioPath(rawPath: string): boolean {
    const path = normaliseStudioPath(rawPath)
    return STUDIO_PREFIXES.some(p => path.startsWith(p)) || STUDIO_EXACT.some(p => path === p || path === `${p}/`)
}

// Host header without a port, lower case.
export function normaliseHost(rawHost: string | undefined | null): string {
    return (rawHost ?? '').trim().toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '')
}

// Studio's auth routes (#12). Sign-in is through Cloudflare Access only, so
// on the admin host just two stay open: our Access sign-in route and Studio's
// session route (read and sign out). GitHub, GitLab, Google, SSO and any other
// spelling under /__nuxt_studio/auth answer 404. An allow-list, so a route a
// later nuxt-studio adds there is closed until someone opens it.
const AUTH_PREFIX = '/__nuxt_studio/auth'
export const STUDIO_SIGN_IN_PATH = '/__nuxt_studio/auth/access'
const AUTH_OPEN = new Set([STUDIO_SIGN_IN_PATH, '/__nuxt_studio/auth/session'])

export function isBlockedStudioAuthPath(rawPath: string): boolean {
    const path = normaliseStudioPath(rawPath)
    if (path !== AUTH_PREFIX && !path.startsWith(`${AUTH_PREFIX}/`)) return false
    return !AUTH_OPEN.has(path)
}

// Studio's server routes (auth, session, meta, API, image proxy). On the
// admin host each response from them is Cache-Control: no-store, except the
// image proxy's own `private, max-age=300`.
const SERVER_PREFIX = '/__nuxt_studio'

export function isStudioServerPath(rawPath: string): boolean {
    const path = normaliseStudioPath(rawPath)
    return path === SERVER_PREFIX || path.startsWith(`${SERVER_PREFIX}/`)
}

// Studio's editor entry (`studio.route` in nuxt.config.ts). On the admin
// host it leads to the Access sign-in instead of Studio's provider picker.
const ENTRY = '/_studio'

export function isStudioEntryPath(rawPath: string): boolean {
    const path = normaliseStudioPath(rawPath)
    return path === ENTRY || path.startsWith(`${ENTRY}/`)
}

// Where sign-in sends the browser afterwards: a path on the same origin, or
// `/`. Refused: anything not starting with exactly one `/`, any backslash or
// control character (browsers read `\` as `/` and drop tab, CR and LF), a
// path that resolves to `//` (`/.//x`, `/%2e%2e//x`), and Studio's own
// routes (a redirect back to /_studio would loop).
const REDIRECT_BASE = 'https://redirect.invalid'
const MAX_REDIRECT_LENGTH = 2048
const SINGLE_SLASH = /^\/(?![/\\])/
// eslint-disable-next-line no-control-regex
const UNSAFE_CHARACTER = /[\\\u0000-\u001f\u007f]/

export function safeStudioRedirect(value: unknown): string {
    if (typeof value !== 'string' || value.length > MAX_REDIRECT_LENGTH) return '/'
    if (!SINGLE_SLASH.test(value) || UNSAFE_CHARACTER.test(value)) return '/'
    let url: URL
    try {
        url = new URL(value, REDIRECT_BASE)
    } catch {
        return '/'
    }
    if (url.origin !== REDIRECT_BASE) return '/'
    const target = url.pathname + url.search
    if (!SINGLE_SLASH.test(target) || UNSAFE_CHARACTER.test(target) || isStudioPath(target)) return '/'
    return target
}

// nuxt-component-meta's routes. They answer 404 on every host, the admin
// host included, since nothing in Studio uses them.
const COMPONENT_META_PREFIX = '/api/component-meta'

export function isComponentMetaPath(rawPath: string): boolean {
    return normaliseStudioPath(rawPath).startsWith(COMPONENT_META_PREFIX)
}

// Studio's image proxy, /__nuxt_studio/ipx/<modifiers>/<id>. nuxt-studio
// 1.8.1 fetches the id from wherever it points (any scheme, or the admin
// host itself, which a Worker cannot reach) and serves the result from the
// admin origin (runtime/server/utils/media/ipx.js). On the admin host the
// middleware answers every request this matches and never lets one reach
// Studio's handler; studioIpxAssetId decides what it serves.
const IPX_PREFIX = '/__nuxt_studio/ipx'

// Permissive on purpose: any spelling that could reach Studio's handler.
export function isStudioIpxPath(rawPath: string): boolean {
    return normaliseStudioPath(rawPath).startsWith(IPX_PREFIX)
}

// The only modifiers Studio's client sends are `_` and `s_200x200,fit_cover`.
// They are checked for shape and then ignored; nothing is resized.
const IPX_RAW = /^\/__nuxt_studio\/ipx\/(?:_|[a-z0-9_,]+)\/(.+)$/
// No leading dot, which also rules out `.` and `..` and hidden files.
const ID_SEGMENT = /^[A-Za-z0-9_-][A-Za-z0-9._-]*$/
const IMAGE_EXTENSION = /\.(?:png|jpe?g|gif|webp|avif|svg|ico)$/i
const MAX_URL_LENGTH = 1024

// Takes the raw request URL (event.node.req.originalUrl: not decoded, query
// included) and returns the public file it names, or null.
//
// Allowed: `/`-separated segments of letters, numbers, `.`, `_` and `-`, with
// no empty segment and none starting with a dot (so no `.` or `..`), ending
// in an image extension. Each of those
// characters is unreserved, so a browser never percent-encodes it, and any
// `%` in the URL is refused. That refuses every encoded `#`, `?`, `/`, `\`,
// `:` and control character at any depth of encoding, and leaves nothing to
// decode. A raw `:`, `?`, `#` or `\` anywhere is refused too.
export function studioIpxAssetId(rawUrl: unknown): string | null {
    if (typeof rawUrl !== 'string' || rawUrl.length > MAX_URL_LENGTH) return null
    if (/[%:?#\\]/.test(rawUrl)) return null
    const id = IPX_RAW.exec(rawUrl)?.[1]
    if (!id || !IMAGE_EXTENSION.test(id)) return null
    const segments = id.split('/')
    if (!segments.every(s => ID_SEGMENT.test(s))) return null
    return id
}
