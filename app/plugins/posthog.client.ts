/**
 * Analytics, configured to stay close to what the privacy policy promises:
 * aggregate counts, no cookies, no cross-site identity, no recordings.
 *
 * posthog-js is imported dynamically so a deploy without
 * NUXT_PUBLIC_POSTHOG_KEY ships none of it, rather than loading the library
 * and then declining to use it.
 */
export default defineNuxtPlugin(async nuxtApp => {
    const config = useRuntimeConfig()
    const key = config.public.posthogKey as string
    if (!key) return

    const {default: posthog} = await import('posthog-js')

    posthog.init(key, {
        api_host: config.public.posthogHost as string,
        // No cookies and no localStorage: state dies with the tab, so there is
        // nothing to consent to and nothing that follows anyone between visits.
        persistence: 'memory',
        // Never build a profile for an anonymous visitor. Nobody signs in here,
        // so in practice this means no person profiles at all.
        person_profiles: 'identified_only',
        respect_dnt: true,
        disable_session_recording: true,
        disable_surveys: true,
        // Pageviews are sent by hand below; autocapture would log every click.
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false
    })

    // SPA navigation doesn't reload the page, so each route change is its own event.
    const router = useRouter()
    router.afterEach(to => {
        nuxtApp.runWithContext(() => {
            posthog.capture('$pageview', {$current_url: window.location.origin + to.fullPath})
        })
    })
})
