// Host guard for Nuxt Studio. nuxt-studio has no host option, so it is done here.
//
// Admin host (runtimeConfig.studioHost): the whole site is served, because
// Studio edits by overlaying the live pages. Every request must carry a valid
// Cloudflare Access JWT, or it gets a 403. Missing Access config also gives
// a 403, so a half-configured deploy fails closed. Responses are noindex.
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

        const access = resolveAccessConfig(config.access) // NUXT_ACCESS_TEAM_DOMAIN, NUXT_ACCESS_AUD
        if (!access) console.warn('[studio-host] Access config is missing, refusing every request on the admin host')
        const token = getHeader(event, 'cf-access-jwt-assertion') || getCookie(event, 'CF_Authorization') || ''

        if (!access || !(await verifyAccessJwt(token, access))) {
            setResponseStatus(event, 403, 'Forbidden')
            setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
            setResponseHeader(event, 'cache-control', 'no-store')
            return 'Forbidden'
        }
        return
    }

    if (isStudioPath(event.path)) {
        throw createError({statusCode: 404, statusMessage: 'Not Found'})
    }
})
