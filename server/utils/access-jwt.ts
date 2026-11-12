// Cloudflare Access JWT verification for the admin host.
//
// Access puts a signed JWT on every request it lets through, in the
// `Cf-Access-Jwt-Assertion` header and the `CF_Authorization` cookie.
// Checking it here means the admin host stays closed even if a request
// reaches the Worker without passing Access (a workers.dev or preview URL,
// a misconfigured policy, a spoofed Host header).
//
// Kept free of Nitro auto-imports so scripts/check-studio-guard.mjs can load
// it directly in Node.
import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from 'jose'

export interface AccessConfig {
    teamDomain: string // e.g. codertheory.cloudflareaccess.com
    aud: string // the Access application's AUD tag
}

// The key set is fetched from the team domain, so only a Cloudflare Access
// team domain is trusted. Anything else counts as missing config.
const TEAM_DOMAIN = /^[a-z0-9-]+\.cloudflareaccess\.com$/

// Logs a failure reason once per isolate, so a bad config or a stream of bad
// tokens shows in Workers logs without flooding them. Only fixed reason
// codes are logged, never a token or a claim value.
const warned = new Set<string>()
function warnOnce(reason: string): void {
    if (warned.has(reason)) return
    warned.add(reason)
    console.warn(`[access-jwt] refusing admin-host request: ${reason}`)
}

// Returns null for anything incomplete or malformed, so callers fail closed.
export function resolveAccessConfig(raw: { teamDomain?: unknown, aud?: unknown } | undefined | null): AccessConfig | null {
    if (!raw || typeof raw.teamDomain !== 'string' || typeof raw.aud !== 'string' || (!raw.teamDomain.trim() && !raw.aud.trim())) {
        warnOnce('config-missing')
        return null
    }
    const teamDomain = raw.teamDomain.trim().toLowerCase().replace(/^https:\/\//, '').replace(/\/$/, '')
    const aud = raw.aud.trim()
    if (!TEAM_DOMAIN.test(teamDomain)) {
        warnOnce('team-domain-invalid')
        return null
    }
    if (!aud) {
        warnOnce('aud-missing')
        return null
    }
    return {teamDomain, aud}
}

// One key set per isolate. jose caches the fetched keys and refetches when it
// sees an unknown `kid`, so Access key rotation is picked up on its own.
let remote: { teamDomain: string, jwks: JWTVerifyGetKey } | undefined

function accessJwks(teamDomain: string): JWTVerifyGetKey {
    if (remote?.teamDomain !== teamDomain) {
        remote = {teamDomain, jwks: createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`))}
    }
    return remote.jwks
}

// The verified claims of a token signed by the team's Access keys, for this
// application, and not expired; null for anything else. Allows 30 s of clock
// skew on exp and nbf. Never throws. Claims such as `email` are returned as
// signed and unchecked; callers check the types they rely on.
export async function verifyAccessJwt(token: string, config: AccessConfig, getKey?: JWTVerifyGetKey): Promise<JWTPayload | null> {
    if (!token) {
        warnOnce('no-token')
        return null
    }
    try {
        const {payload} = await jwtVerify(token, getKey ?? accessJwks(config.teamDomain), {
            issuer: `https://${config.teamDomain}`,
            audience: config.aud,
            algorithms: ['RS256'],
            requiredClaims: ['exp'],
            clockTolerance: 30
        })
        return payload
    } catch (error) {
        warnOnce(failureReason(error))
        return null
    }
}

// A jose error code, plus the claim name for a claim check, such as
// `ERR_JWT_CLAIM_VALIDATION_FAILED:aud`. Other errors (a failed key set
// fetch) give only their class name.
function failureReason(error: unknown): string {
    const {code, claim, name} = (error ?? {}) as { code?: unknown, claim?: unknown, name?: unknown }
    const safe = (value: unknown) => typeof value === 'string' && /^[\w-]{1,64}$/.test(value) ? value : ''
    if (safe(code)) return safe(claim) ? `${code}:${claim}` : String(code)
    return safe(name) || 'unknown-error'
}
