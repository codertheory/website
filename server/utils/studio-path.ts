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

// Studio's image proxy, /__nuxt_studio/ipx/<modifiers>/<id>. nuxt-studio
// 1.8.1 fetches any id with a scheme (https://...) and serves the result
// from the admin origin (runtime/server/utils/media/ipx.js). Only
// same-origin ids, which is all the editor asks for, may pass.
const IPX_PREFIX = '/__nuxt_studio/ipx'
const IPX_HEAD = /^\/*__nuxt_studio\/+ipx(?:\/+|$)/i
const SCHEME = /[a-z][a-z0-9+.-]*:/i

export function isStudioIpxPath(rawPath: string): boolean {
    return normaliseStudioPath(rawPath).startsWith(IPX_PREFIX)
}

// False when the id, decoded as many times as it takes, holds a scheme
// anywhere or starts with `//` or `\\`. An id that will not decode cleanly
// is refused too. The modifiers segment is skipped, since `w:100` is valid
// there and Studio never fetches it.
export function isSafeStudioIpxPath(rawPath: string): boolean {
    let path = rawPath.split('?')[0]?.split('#')[0] ?? ''
    for (let i = 0; ; i++) {
        if (i === 10) return false
        let decoded: string
        try {
            decoded = decodeURIComponent(path)
        } catch {
            return false
        }
        if (decoded === path) break
        path = decoded
    }
    path = path.replace(/\\/g, '/')
    const head = IPX_HEAD.exec(path)
    if (!head) return false
    const rest = path.slice(head[0].length)
    const slash = rest.indexOf('/')
    const id = slash === -1 ? '' : rest.slice(slash + 1)
    return !SCHEME.test(id) && !id.startsWith('//')
}
