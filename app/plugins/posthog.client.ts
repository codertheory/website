/**
 * Analytics, configured to stay close to what the privacy policy promises:
 * aggregate counts, no cookies, no cross-site identity, no recordings.
 *
 * posthog-js is imported dynamically so a deploy without
 * NUXT_PUBLIC_POSTHOG_KEY ships none of it, rather than loading the library
 * and then declining to use it.
 */
export default defineNuxtPlugin(nuxtApp => {
    const config = useRuntimeConfig()
    const key = config.public.posthogKey as string
    if (!key) return

    // Grab the router before any await. Composables need the Nuxt context, and
    // an earlier version called useRouter() after `await import(...)`, by which
    // point the context is gone: init ran, the route hook never registered, and
    // nothing was ever captured.
    const router = useRouter()

    import('posthog-js').then(({default: posthog}) => {
        posthog.init(key, {
            api_host: config.public.posthogHost as string,
            // No cookies and no localStorage: state dies with the tab, so there
            // is nothing to consent to and nothing that follows anyone between
            // visits.
            persistence: 'memory',
            // Never build a profile for an anonymous visitor. Nobody signs in
            // here, so in practice this means no person profiles at all.
            person_profiles: 'identified_only',
            respect_dnt: true,
            disable_session_recording: true,
            disable_surveys: true,
            // Pageviews are sent by hand below; autocapture would log every click.
            autocapture: false,
            capture_pageview: false,
            capture_pageleave: false
        })

        const send = (fullPath: string) => {
            nuxtApp.runWithContext(() => {
                posthog.capture('$pageview', {$current_url: window.location.origin + fullPath})
            })
        }

        // afterEach only fires for navigations that happen after it is
        // registered, and the first one has already resolved by the time a
        // plugin runs. Send that one by hand or every single-page visit, which
        // is most of them, goes uncounted.
        send(router.currentRoute.value.fullPath)
        router.afterEach(to => send(to.fullPath))
    })
})
