import { queryCollection } from '@nuxt/content/server'

/**
 * Dynamic routes for @nuxtjs/sitemap. The module discovers static pages from
 * app/pages on its own, but /projects/[slug] and /blog/[slug] only exist as
 * content files, so they have to be enumerated here or they never get indexed.
 */
export default defineSitemapEventHandler(async (event) => {
    const [projects, posts] = await Promise.all([
        queryCollection(event, 'projects').order('date', 'DESC').all(),
        queryCollection(event, 'news').order('date', 'DESC').all()
    ])

    const slugOf = (path: string | undefined) => (path || '').split('/').filter(Boolean).pop() || ''

    return [
        ...projects.map(p => ({
            loc: `/projects/${slugOf(p.path)}`,
            lastmod: p.date,
            changefreq: 'monthly' as const,
            priority: 0.8
        })),
        ...posts.map(p => ({
            loc: `/blog/${slugOf(p.path)}`,
            lastmod: p.date,
            changefreq: 'monthly' as const,
            priority: 0.6
        }))
    ]
})
