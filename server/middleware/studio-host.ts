// Host guard for Nuxt Studio. nuxt-studio has no host option, so it is done here.
//
// Admin host (runtimeConfig.studioHost): the whole site is served, because
// Studio edits by overlaying the live pages. Every request must carry a valid
// Cloudflare Access JWT, or it gets a 403. Missing Access config also gives
// a 403, so a half-configured deploy fails closed. Responses are noindex.
//
// After the Access check, two things on the admin host are answered here and
// never reach nuxt-studio or @nuxt/content:
// - Studio's image proxy (/__nuxt_studio/ipx/**). Studio's own handler would
//   fetch the id from wherever it points, and a Worker cannot fetch its own
//   Custom Domain anyway. Instead, allow-listed local image paths are served
//   from the ASSETS binding (see studioIpxAssetId), sandboxed, and anything
//   else is a 404. These are public files, so Studio's session check is not
//   needed; Access still is.
// - nuxt-component-meta (/api/component-meta*): 404, as on every host.
//
// Any other host: Studio's routes answer 404 as if they did not exist.
//
// Static files under /_studio-app/ are served by Cloudflare before the Worker
// runs, so they skip this guard on every host. That bundle is the public
// open-source editor and holds no data; accepted on #3.
import type { H3Event } from 'h3'

const IPX_HEADERS = {
    'content-security-policy': "default-src 'none'; sandbox",
    'x-content-type-options': 'nosniff'
}

interface AssetsBinding {
    fetch: (request: Request) => Promise<Response>
}

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

        // event.path has been decoded once by h3; the raw URL is checked too,
        // so no spelling of either slips past to Studio's handler.
        const rawUrl = event.node.req.originalUrl ?? ''
        if (isStudioIpxPath(event.path) || isStudioIpxPath(rawUrl)) {
            setResponseHeaders(event, IPX_HEADERS)
            return serveStudioIpx(event, rawUrl)
        }
        if (isComponentMetaPath(event.path) || isComponentMetaPath(rawUrl)) {
            return notFound(event)
        }
        return
    }

    if (isStudioPath(event.path)) {
        throw createError({statusCode: 404, statusMessage: 'Not Found'})
    }
})

// Serves a local image for Studio's media previews, or a 404. The id comes
// from the raw URL only; no resizing (ipx never ran in the Worker anyway).
async function serveStudioIpx(event: H3Event, rawUrl: string) {
    const id = event.method === 'GET' || event.method === 'HEAD' ? studioIpxAssetId(rawUrl) : null
    const assets = (event.context.cloudflare?.env as {ASSETS?: AssetsBinding} | undefined)?.ASSETS
    if (!id || !assets) return notFound(event)

    const asset = await assets.fetch(new Request(new URL(`/${id}`, getRequestURL(event).origin)))
    if (asset.status !== 200) {
        await asset.body?.cancel()
        return notFound(event)
    }
    setResponseHeaders(event, {
        'content-type': asset.headers.get('content-type') || 'application/octet-stream',
        'cache-control': 'private, max-age=300'
    })
    return new Uint8Array(await asset.arrayBuffer())
}

function notFound(event: H3Event) {
    setResponseStatus(event, 404, 'Not Found')
    setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
    setResponseHeader(event, 'cache-control', 'no-store')
    return 'Not Found'
}
