// Studio sign-in through Cloudflare Access (#12). /_studio leads here on the
// admin host (server/middleware/studio-host.ts); on any other host the
// middleware answers 404 before this runs.
//
// It starts a Studio session only when all of these hold, and otherwise
// answers 403 without touching the session:
// - the middleware verified an Access JWT on the admin host and left its
//   claims on event.context.studioAccess
// - the JWT `email` claim equals NUXT_STUDIO_EDITOR_EMAIL (trimmed, any case)
// - NUXT_STUDIO_GIT_GITHUB_TOKEN is set
// - NUXT_STUDIO_AUTH_SESSION_SECRET is set (32+ characters)
//
// The session carries the single-repo token from NUXT_STUDIO_GIT_GITHUB_TOKEN
// (nuxt-studio's setStudioUserSession), and Studio's session route returns it
// to the editor's page. That is accepted on #12 because the token is limited
// to codertheory/website.
import type { StudioAccess } from '../../../utils/studio-auth'

export default defineEventHandler(async (event) => {
    setResponseHeader(event, 'cache-control', 'no-store')

    const config = useRuntimeConfig(event)
    const adminHost = normaliseHost(config.studioHost)
    const host = normaliseHost(getRequestHost(event, {xForwardedHost: false}))
    const access = event.context.studioAccess as StudioAccess | undefined

    const allowed = Boolean(adminHost) && host === adminHost
        && access !== undefined
        && access.sessionSecretSet
        && access.githubTokenSet
        && isEditorEmail(access.email, config.studioEditorEmail) // NUXT_STUDIO_EDITOR_EMAIL
    if (!allowed) {
        setResponseStatus(event, 403, 'Forbidden')
        setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
        return 'Forbidden'
    }

    await setStudioUserSession(event, {name: access.name || access.email, email: access.email})
    return sendRedirect(event, safeStudioRedirect(getQuery(event).redirect), 302)
})
