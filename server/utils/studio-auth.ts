// Checks for Studio sign-in through Cloudflare Access (#12), used by
// server/middleware/studio-host.ts and the sign-in route
// server/routes/__nuxt_studio/auth/access.get.ts.
//
// Kept free of Nitro auto-imports so scripts/check-studio-guard.mjs can load
// it directly in Node.

// What the admin-host middleware leaves on event.context.studioAccess once
// the Access JWT has passed. The two flags are read before nuxt-studio's own
// middleware runs, because that one fills in fallbacks: a session secret
// derived from the GitHub token, and the token from STUDIO_GITHUB_TOKEN.
// Neither fallback counts as configured here.
export interface StudioAccess {
    email: string // the JWT `email` claim, trimmed and lower case; '' if absent
    name: string // the JWT `name` claim if any; Access usually sends none
    sessionSecretSet: boolean // NUXT_STUDIO_AUTH_SESSION_SECRET, 32+ characters
    githubTokenSet: boolean // NUXT_STUDIO_GIT_GITHUB_TOKEN
}

// Trimmed and lower case; '' for anything that is not a string.
export function normaliseEmail(value: unknown): string {
    return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

// True only when both are set and equal after trimming, ignoring case. One
// editor email, never a list.
export function isEditorEmail(email: unknown, editorEmail: unknown): boolean {
    const editor = normaliseEmail(editorEmail)
    return editor !== '' && normaliseEmail(email) === editor
}

// h3 seals sessions with iron, which refuses a password under 32 characters.
// Anything shorter, or unset, counts as not configured.
export function isUsableSessionSecret(secret: unknown): secret is string {
    return typeof secret === 'string' && secret.trim().length >= 32
}
