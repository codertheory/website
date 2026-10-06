// Two caching guards for returning visitors after a deploy.
//
// 1. Error responses are never cacheable. Nuxt's route rules put a year-long
//    `immutable` header on everything under /_nuxt, including the 404 for a
//    file that no longer exists (an old build's chunk, or a new one requested
//    mid-rollout). A browser that caches that 404 keeps failing to load the
//    file for a year, until its site data is cleared.
// 2. Pages must be revalidated. The HTML names the hashed files of one build,
//    so a browser reusing an old copy asks for files that are gone.
export default defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook('beforeResponse', (event) => {
        if (getResponseStatus(event) >= 400) setResponseHeader(event, 'cache-control', 'no-store')
    })
    nitroApp.hooks.hook('error', (_error, context) => {
        if (context.event) setResponseHeader(context.event, 'cache-control', 'no-store')
    })
    nitroApp.hooks.hook('render:response', (response) => {
        response.headers ||= {}
        if (!response.headers['cache-control'] && !response.headers['Cache-Control']) {
            response.headers['cache-control'] = 'no-cache'
        }
    })
})
