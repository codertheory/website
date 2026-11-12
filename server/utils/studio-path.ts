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
