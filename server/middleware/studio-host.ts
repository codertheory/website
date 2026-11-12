// Host guard for Nuxt Studio. nuxt-studio has no host option, so it is done here.
//
// Admin host (runtimeConfig.studioHost): the whole site is served, because
// Studio edits by overlaying the live pages. Every request must carry a valid
// Cloudflare Access JWT, or it gets a 403. Missing Access config also gives
// a 403, so a half-configured deploy fails closed. Responses are noindex.
//
// Studio's image proxy on the admin host refuses any id that is not a
// same-origin path (see isSafeStudioIpxPath), and its responses are
// sandboxed, so nothing it serves can run script on the admin origin.
//
// Any other host: Studio's routes answer 404 as if they did not exist.
//
// Static files under /_studio-app/ are served by Cloudflare before the Worker
// runs, so they skip this guard on every host. That bundle is the public
// open-source editor and holds no data; accepted on #3.
export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig(event)
    const adminHost = normaliseHost(config.studioHost) // NUXT_STUDIO_HOST
    const host = normaliseHost(getRequestHost(event, {xForwardedHost: false}))

    if (adminHost && host === adminHost) {
        setResponseHeader(event, 'x-robots-tag', 'noindex, nofollow')

        // Logs why, once per isolate, when the config is missing or invalid.
        const access = resolveAccessConfig(config.access) // NUXT_ACCESS_TEAM_DOMAIN, NUXT_ACCESS_AUD
        const token = getHeader(event, 'cf-access-jwt-assertion') || getCookie(event, 'CF_Authorization') || ''

        if (!access || !(await verifyAccessJwt(token, access))) {
            setResponseStatus(event, 403, 'Forbidden')
            setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
            setResponseHeader(event, 'cache-control', 'no-store')
            return 'Forbidden'
        }

        if (isStudioIpxPath(event.path)) {
            setResponseHeader(event, 'content-security-policy', "default-src 'none'; sandbox")
            setResponseHeader(event, 'x-content-type-options', 'nosniff')
            if (!isSafeStudioIpxPath(event.path)) {
                setResponseStatus(event, 400, 'Bad Request')
                setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
                setResponseHeader(event, 'cache-control', 'no-store')
                return 'Bad Request'
            }
        }
        return
    }

    if (isStudioPath(event.path)) {
        throw createError({statusCode: 404, statusMessage: 'Not Found'})
    }
})
