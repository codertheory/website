type SeoOptions = {
    title?: string
    description?: string
    image?: string
    imageAlt?: string
    imageWidth?: number
    imageHeight?: number
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

    // Dates in frontmatter are plain YYYY-MM-DD, which is not the full RFC 3339
    // with offset that a crawler expects, so widen it rather than emit a date
    // that gets dropped.
    const rfc3339 = (value: string | undefined) => {
        if (!value) return undefined
        const d = new Date(value)
        return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
    }

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
    const imageAlt = computed(() => opts.value.imageAlt || `${siteName}, ${pageTitle.value || 'home'}`)

    // Every image this site serves as an og:image is a square 512 export (the
    // project -og.png files and /icon-512.png). Declaring the size lets a
    // crawler lay the card out without fetching the file first; override via
    // options if a page ever points at something a different shape.
    const imageWidth = computed(() => opts.value.imageWidth ?? 512)
    const imageHeight = computed(() => opts.value.imageHeight ?? 512)

    const IMAGE_TYPES: Record<string, string> = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        webp: 'image/webp',
        gif: 'image/gif',
        avif: 'image/avif'
    }
    const imageType = computed(() => {
        const ext = ogImage.value.split('?')[0]?.split('.').pop()?.toLowerCase() || ''
        return IMAGE_TYPES[ext]
    })

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
        ogImageWidth: () => imageWidth.value,
        ogImageHeight: () => imageHeight.value,
        ogImageType: () => imageType.value,
        twitterCard: 'summary',
        twitterTitle: () => fullTitle.value,
        twitterDescription: () => description.value,
        twitterImage: () => ogImage.value,
        twitterImageAlt: () => imageAlt.value,
        twitterSite: twitterHandle,
        twitterCreator: twitterHandle,
        articlePublishedTime: () => opts.value.publishedTime,
        // Discord's link preview reads og:pubdate / pubdate rather than
        // article:published_time, and wants full RFC 3339 with an offset.
        'og:pubdate': () => rfc3339(opts.value.publishedTime),
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
