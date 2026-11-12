// Path and host matching for the Studio guard in server/middleware/studio-host.ts.
// Kept free of Nitro auto-imports so scripts/check-studio-guard.mjs can load
// it directly in Node.

// Studio's editor entry, its auth and API routes, and its draft-preview
// service worker. `/_studio` is a prefix on purpose, so it also covers
// `/_studio-app/*` if a request for it ever reaches the Worker.
const STUDIO_PREFIXES = ['/_studio', '/__nuxt_studio']
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
