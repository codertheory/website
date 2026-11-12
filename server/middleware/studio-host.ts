// Host guard for Nuxt Studio. nuxt-studio has no host option, so it is done here.
//
// Admin host (runtimeConfig.studioHost): the whole site is served, because
// Studio edits by overlaying the live pages. Every request must carry a valid
// Cloudflare Access JWT, or it gets a 403. Missing Access config also gives
// a 403, so a half-configured deploy fails closed. Responses are noindex.
//
// Studio sign-in (#12) is through Access only. After the JWT check:
// - The verified email and the Studio config flags go on
//   event.context.studioAccess for the sign-in route,
//   server/routes/__nuxt_studio/auth/access.get.ts. This middleware runs
//   before nuxt-studio's own, so it sees the config before Studio fills in
//   its fallbacks (see server/utils/studio-auth.ts).
// - A Studio session must belong to the current Access identity, and that
//   identity must be the configured editor. If not, or if the session
//   secret is not configured so the session cannot be read, the session is
//   cleared and the request gets a 403. The request stops there because
//   Studio's handlers would otherwise read the old cookie again.
// - /_studio goes to the sign-in route, never to Studio's provider picker.
// - Studio's GitHub, GitLab, Google and SSO login routes answer 404.
//
// Two more things on the admin host are answered here and never reach
// nuxt-studio or @nuxt/content:
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
import type { StudioAccess } from '../utils/studio-auth'

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

        const claims = access ? await verifyAccessJwt(token, access) : null
        if (!claims) return forbidden(event, 'Forbidden')

        // Read before nuxt-studio's studio-env middleware changes them.
        const studio = config.studio
        const githubToken = studio?.git?.githubToken
        const studioAccess: StudioAccess = {
            email: normaliseEmail(claims.email),
            name: typeof claims.name === 'string' ? claims.name.trim() : '',
            sessionSecretSet: isUsableSessionSecret(studio?.auth?.sessionSecret),
            githubTokenSet: typeof githubToken === 'string' && githubToken.trim() !== ''
        }
        event.context.studioAccess = studioAccess

        if (hasStudioSession(event) && !(await studioSessionAllowed(event, studioAccess, config.studioEditorEmail))) {
            await endStudioSession(event, studioAccess.sessionSecretSet)
            return forbidden(event, 'Studio session ended. Reload the page.')
        }

        // event.path has been decoded once by h3; the raw URL is checked too,
        // so no spelling of either slips past to Studio's handler.
        const rawUrl = event.node.req.originalUrl ?? ''
        if (isBlockedStudioAuthPath(event.path) || isBlockedStudioAuthPath(rawUrl)) {
            return notFound(event)
        }
        if (isStudioEntryPath(event.path) || isStudioEntryPath(rawUrl)) {
            const next = safeStudioRedirect(getQuery(event).redirect)
            setResponseHeader(event, 'cache-control', 'no-store')
            return sendRedirect(event, next === '/' ? STUDIO_SIGN_IN_PATH : `${STUDIO_SIGN_IN_PATH}?redirect=${encodeURIComponent(next)}`, 302)
        }
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

// h3 reads a sealed session from this header as well as from the cookie.
const STUDIO_SESSION_COOKIE = 'studio-session'
const STUDIO_SESSION_HEADER = 'x-studio-session-session'

function hasStudioSession(event: H3Event): boolean {
    return Boolean(getCookie(event, STUDIO_SESSION_COOKIE) || getHeader(event, STUDIO_SESSION_HEADER))
}

// Reads the session the way nuxt-studio does (runtime/server/routes/auth/
// session.get.js): same name, secret and cookie options. A session with no
// user is signed out as far as Studio is concerned, so it is left alone.
async function studioSessionAllowed(event: H3Event, studioAccess: StudioAccess, editorEmail: unknown): Promise<boolean> {
    const secret = useRuntimeConfig(event).studio?.auth?.sessionSecret
    if (!isUsableSessionSecret(secret)) return false
    const session = await useSession<{user?: {email?: unknown}}>(event, {
        name: STUDIO_SESSION_COOKIE,
        password: secret,
        cookie: {secure: getRequestProtocol(event) === 'https', path: '/'}
    })
    const user = session.data.user
    if (!user) return true
    return isEditorEmail(studioAccess.email, editorEmail) && normaliseEmail(user.email) === studioAccess.email
}

// Clears with nuxt-studio's own helper when the secret is set. Without a
// usable secret the session cannot be opened, so the cookies are deleted.
async function endStudioSession(event: H3Event, secretSet: boolean) {
    if (secretSet) {
        await clearStudioUserSession(event)
        return
    }
    deleteCookie(event, STUDIO_SESSION_COOKIE, {path: '/'})
    deleteCookie(event, 'studio-session-check', {path: '/'})
}

function forbidden(event: H3Event, message: string) {
    setResponseStatus(event, 403, 'Forbidden')
    setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
    setResponseHeader(event, 'cache-control', 'no-store')
    return message
}

function notFound(event: H3Event) {
    setResponseStatus(event, 404, 'Not Found')
    setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
    setResponseHeader(event, 'cache-control', 'no-store')
    return 'Not Found'
}
