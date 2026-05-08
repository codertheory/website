<template>
  <div v-if="post" class="page">
    <section class="wrap-narrow post-hero">
      <div class="crumb">
        <NuxtLink to="/blog">Blog</NuxtLink>
        <span>/</span>
        <span>{{ post.cat }}</span>
      </div>
      <h1>{{ post.title }}</h1>
      <div class="meta">{{ formatDate(post.date) }} · {{ post.cat }} · 3 min read</div>
    </section>

    <article class="prose wrap-narrow">
      <ContentRenderer :value="post" />

      <div v-if="nextPost" class="post-next">
        <div class="label">// next up</div>
        <div class="next-title">{{ nextPost.title }}</div>
        <NuxtLink class="arrow-link" :to="`/blog/${slugFromPath(nextPost.path)}`">
          Read it <ArrowRight :size="14" />
        </NuxtLink>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
    const route = useRoute()
    const slug = computed(() => String(route.params.slug))
    const newsPath = computed(() => `/news/${slug.value}`)

    const slugFromPath = (path: string | undefined) => (path || '').split('/').filter(Boolean).pop() || ''

    const formatDate = (s: string) => {
        const d = new Date(s)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const { data: post } = await useAsyncData(
        () => `post-${slug.value}`,
        () => queryCollection('news').path(newsPath.value).first(),
        { watch: [newsPath] }
    )

    if (!post.value) {
        throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })
    }

    const { data: allPosts } = await useAsyncData('blog-all', () =>
        queryCollection('news').order('date', 'DESC').all()
    )

    const nextPost = computed(() => {
        const list = allPosts.value || []
        if (list.length === 0) return null
        const idx = list.findIndex(p => p.path === post.value?.path)
        return list[(idx + 1) % list.length] || null
    })

    const config = useRuntimeConfig()
    const siteUrl = (config.public.siteUrl as string).replace(/\/$/, '')

    useSiteSeo(() => {
        const p = post.value
        return {
            title: p?.title,
            description: p?.excerpt,
            image: p?.image || undefined,
            imageAlt: p ? `${p.title} — ${p.cat}` : undefined,
            type: 'article',
            publishedTime: p?.date,
            section: p?.cat,
            author: config.public.siteAuthor as string
        }
    })

    useHead(() => {
        const p = post.value
        if (!p) return {}
        const image = p.image
            ? (/^https?:\/\//.test(p.image) ? p.image : `${siteUrl}${p.image.startsWith('/') ? p.image : `/${p.image}`}`)
            : `${siteUrl}${config.public.defaultOgImage as string}`
        const url = `${siteUrl}/blog/${slug.value}`
        const ldJson = {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: p.title,
            description: p.excerpt,
            image,
            datePublished: p.date,
            articleSection: p.cat,
            mainEntityOfPage: { '@type': 'WebPage', '@id': url },
            author: {
                '@type': 'Person',
                name: config.public.siteAuthor as string,
                url: siteUrl
            },
            publisher: {
                '@type': 'Organization',
                name: config.public.siteName as string,
                logo: {
                    '@type': 'ImageObject',
                    url: `${siteUrl}/icon-512.png`
                }
            }
        }
        return {
            script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(ldJson) }]
        }
    })

    useScrollReveal()
</script>
