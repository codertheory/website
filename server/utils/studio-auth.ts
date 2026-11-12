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
    email: string // the JWT `email` claim, normalised (normaliseEmail); '' if absent or refused
    sessionSecretSet: boolean // NUXT_STUDIO_AUTH_SESSION_SECRET, 32+ characters
    githubTokenSet: boolean // NUXT_STUDIO_GIT_GITHUB_TOKEN, not blank
}

// What a Studio session started by the sign-in route holds, besides what
// nuxt-studio adds (provider, accessToken). `name` and `email` are the
// commit author Studio's editor writes, never the Access identity. The
// Access email is kept only in `accessEmail`, which the middleware binds
// the session to and Studio's editor never reads.
export interface StudioSessionUser {
    name: string
    email: string
    accessEmail: string
}

// ASCII whitespace only. String.prototype.trim would also strip Unicode
// spaces such as NBSP, which then pass as an ASCII address.
const ASCII_SPACE = /^[\t\n\r ]+|[\t\n\r ]+$/g
// Printable ASCII without the space. An address with anything else (a
// Unicode letter, a control or zero-width character) is refused outright.
const PRINTABLE_ASCII = /^[\x21-\x7e]+$/

// Trimmed of ASCII whitespace and lower-cased in ASCII only; '' for
// anything that is not a string or holds a character outside printable
// ASCII. Unicode case folding is never applied, so the Kelvin sign (U+212A)
// cannot stand in for `k`.
export function normaliseEmail(value: unknown): string {
    if (typeof value !== 'string') return ''
    const trimmed = value.replace(ASCII_SPACE, '')
    if (!PRINTABLE_ASCII.test(trimmed)) return ''
    return trimmed.replace(/[A-Z]/g, c => String.fromCharCode(c.charCodeAt(0) + 32))
}

// True only when both are set and equal after normaliseEmail. One editor
// email, never a list.
export function isEditorEmail(email: unknown, editorEmail: unknown): boolean {
    const editor = normaliseEmail(editorEmail)
    return editor !== '' && normaliseEmail(email) === editor
}

// h3 seals sessions with iron, which refuses a password under 32 characters.
// Anything shorter, or unset, counts as not configured.
export function isUsableSessionSecret(secret: unknown): secret is string {
    return typeof secret === 'string' && secret.trim().length >= 32
}

// The commit author for Studio's commits (NUXT_STUDIO_COMMIT_NAME and
// NUXT_STUDIO_COMMIT_EMAIL), trimmed; null when either is unset or blank,
// which makes sign-in fail closed. Any address is accepted; wrangler.jsonc
// sets the owner's GitHub noreply address.
export function resolveStudioCommitIdentity(name: unknown, email: unknown): {name: string, email: string} | null {
    if (typeof name !== 'string' || typeof email !== 'string') return null
    const identity = {name: name.trim(), email: email.trim()}
    return identity.name && identity.email ? identity : null
}
