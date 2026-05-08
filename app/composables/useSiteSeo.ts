type SeoOptions = {
    title?: string
    description?: string
    image?: string
    imageAlt?: string
    type?: 'website' | 'article' | 'profile'
    publishedTime?: string
    modifiedTime?: string
    tags?: string[]
    author?: string
    section?: string
    noindex?: boolean
}

export function useSiteSeo(options: SeoOptions | (() => SeoOptions) = {}) {
    const config = useRuntimeConfig()
    const route = useRoute()

    const siteUrl = (config.public.siteUrl as string).replace(/\/$/, '')
    const siteName = config.public.siteName as string
    const siteDescription = config.public.siteDescription as string
    const defaultOgImage = config.public.defaultOgImage as string
    const twitterHandle = config.public.twitterHandle as string

    const opts = computed<SeoOptions>(() => (typeof options === 'function' ? options() : options))

    const fullUrl = computed(() => `${siteUrl}${route.path}`)
    const description = computed(() => opts.value.description || siteDescription)
    const pageTitle = computed(() => opts.value.title)
    const fullTitle = computed(() => {
        const t = pageTitle.value
        return t ? `${t} · ${siteName}` : `${siteName} — software, writing, and ideas`
    })
    const ogImage = computed(() => {
        const img = opts.value.image || defaultOgImage
        return /^https?:\/\//.test(img) ? img : `${siteUrl}${img.startsWith('/') ? img : `/${img}`}`
    })
    const imageAlt = computed(() => opts.value.imageAlt || `${siteName} — ${pageTitle.value || 'home'}`)

    useSeoMeta({
        title: () => fullTitle.value,
        description: () => description.value,
        ogTitle: () => fullTitle.value,
        ogDescription: () => description.value,
        ogType: () => opts.value.type || 'website',
        ogUrl: () => fullUrl.value,
        ogSiteName: siteName,
        ogImage: () => ogImage.value,
        ogImageAlt: () => imageAlt.value,
        twitterCard: 'summary',
        twitterTitle: () => fullTitle.value,
        twitterDescription: () => description.value,
        twitterImage: () => ogImage.value,
        twitterImageAlt: () => imageAlt.value,
        twitterSite: twitterHandle,
        twitterCreator: twitterHandle,
        articlePublishedTime: () => opts.value.publishedTime,
        articleModifiedTime: () => opts.value.modifiedTime,
        articleAuthor: () => opts.value.author ? [opts.value.author] : undefined,
        articleSection: () => opts.value.section,
        articleTag: () => opts.value.tags,
        robots: () => opts.value.noindex ? 'noindex, nofollow' : 'index, follow'
    })

    useHead({
        link: [{rel: 'canonical', href: () => fullUrl.value}]
    })
}
