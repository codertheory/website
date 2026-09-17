<template>
  <div v-if="project" class="page">
    <section class="wrap detail-hero">
      <div class="crumb">
        <NuxtLink to="/projects">Projects</NuxtLink>
        <span>/</span>
        <span>{{ project.title }}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
        <span class="spin-tag">
          <span :class="['dot', `dot--${project.status}`]" /> {{ project.statusLabel }}
        </span>
        <span class="chip">{{ project.type }}</span>
      </div>
      <h1 class="h-display" style="font-size: clamp(48px, 6vw, 80px);">{{ project.title }}</h1>
      <p style="font-size: 22px; color: var(--ink-soft); max-width: 700px; margin-top: 14px; font-family: var(--f-display); font-weight: 400; line-height: 1.4;">
        {{ project.tag }}
      </p>
    </section>

    <section class="wrap" style="padding-bottom: 60px;">
      <div class="detail-grid">
        <div>
          <div class="detail-mock">
            <div class="deviceish">
              <div class="notch" />
              <div :class="['device-icon', { 'device-icon--img': project.iconImage && !project.iconImageTile, 'device-icon--tile': project.iconImage && project.iconImageTile }]">
                <ProjectIcon :image="project.iconImage" :image-dark="project.iconImageDark" :glyph="project.icon" :alt="`${project.title} icon`" />
              </div>
            </div>
          </div>

          <h3 style="font-family: var(--f-display); font-size: 30px; margin-top: 40px; margin-bottom: 6px; font-weight: 600; letter-spacing: -0.015em;">
            What's inside
          </h3>
          <p style="color: var(--ink-soft); margin: 0;">The features I'd actually point a friend to.</p>
          <ul class="detail-features">
            <li v-for="(f, i) in (project.features || [])" :key="i" class="fade-up">
              <span class="num">{{ padNum(i + 1) }}</span>
              <div>
                <b>{{ f.t }}</b>
                <span>{{ f.d }}</span>
              </div>
            </li>
          </ul>
        </div>

        <aside class="card detail-side">
          <h5>At a glance</h5>
          <div class="row"><span class="k">platform</span><span class="v">{{ (project.platforms || []).join(', ') }}</span></div>
          <div class="row"><span class="k">type</span><span class="v">{{ project.type }}</span></div>
          <div class="row"><span class="k">started</span><span class="v">{{ project.started }}</span></div>
          <div class="row"><span class="k">status</span><span class="v">{{ project.statusLabel }}</span></div>

          <h5 style="margin-top: 24px;">Stack</h5>
          <div class="stack-chips">
            <span v-for="s in (project.stack || [])" :key="s" class="chip">{{ s }}</span>
          </div>

          <h5 style="margin-top: 24px;">Links</h5>
          <div class="detail-links">
            <a v-for="(l, i) in (project.links || [])" :key="i" :href="l.href">
              <span>{{ l.label }}</span>
              <ExternalIcon />
            </a>
          </div>
        </aside>
      </div>
    </section>

    <section class="wrap story-block">
      <span class="eyebrow">Why I built it</span>
      <div class="body" style="margin-top: 18px;">
        <p>
          <template v-for="(seg, i) in whySegments" :key="i">
            <em v-if="seg.em">{{ seg.text }}</em>
            <template v-else>{{ seg.text }}</template>
          </template>
        </p>
      </div>
    </section>

    <section v-if="project.screenshots?.length" class="wrap" style="padding-bottom: 80px;">
      <h3 style="font-family: var(--f-display); font-size: 30px; font-weight: 600; letter-spacing: -0.015em; margin: 0;">
        Screenshots
      </h3>
      <p style="color: var(--ink-soft); margin: 6px 0 0;">A few favourite views.</p>
      <div class="shots-strip">
        <div v-for="(shot, i) in project.screenshots" :key="i" class="shot fade-up">
          <NuxtImg :src="shot.src" :alt="shot.alt || `${project.title} screenshot ${i + 1}`" />
        </div>
      </div>
    </section>

    <section v-if="hasWriteup" class="project-writeup">
      <div class="wrap-narrow">
        <span class="eyebrow">In depth</span>
      </div>
      <article class="prose">
        <ContentRenderer :value="project" />
      </article>
    </section>

    <nav v-if="prevProject && nextProject" class="wrap project-nav" aria-label="More projects">
      <NuxtLink class="project-nav__item" :to="`/projects/${slugFromPath(prevProject.path)}`">
        <span class="dir">// previous</span>
        <span class="title">{{ prevProject.title }}</span>
        <span class="tag">{{ prevProject.tag }}</span>
      </NuxtLink>
      <NuxtLink class="project-nav__item project-nav__item--next" :to="`/projects/${slugFromPath(nextProject.path)}`">
        <span class="dir">// next</span>
        <span class="title">{{ nextProject.title }}</span>
        <span class="tag">{{ nextProject.tag }}</span>
      </NuxtLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
    const route = useRoute()
    const path = computed(() => `/projects/${route.params.slug}`)

    const { data: project } = await useAsyncData(
        () => `project-${route.params.slug}`,
        () => queryCollection('projects').path(path.value).first(),
        { watch: [path] }
    )

    if (!project.value) {
        throw createError({ statusCode: 404, statusMessage: 'Project not found', fatal: true })
    }

    const whySegments = computed(() => {
        const why = project.value?.why || ''
        return why.split('*').map((text, i) => ({ text, em: i % 2 === 1 }))
    })

    const padNum = (n: number) => String(n).padStart(2, '0')

    const slugFromPath = (path: string | undefined) => (path || '').split('/').filter(Boolean).pop() || ''

    // Same date-DESC order as the index, so prev/next match the order people
    // just browsed. Wraps at both ends, like the blog's "next up", so the
    // footer is never half-empty on the newest or oldest project.
    const { data: allProjects } = await useAsyncData('projects-nav', () =>
        queryCollection('projects').order('date', 'DESC').all()
    )

    const neighbourAt = (offset: number) => computed(() => {
        const list = allProjects.value || []
        if (list.length < 2) return null
        const idx = list.findIndex(p => p.path === project.value?.path)
        if (idx === -1) return null
        return list[(idx + offset + list.length) % list.length] || null
    })

    const prevProject = neighbourAt(-1)
    const nextProject = neighbourAt(1)

    // The markdown body under the frontmatter was parsed and shipped but never
    // rendered, so every project's long-form writeup was invisible. Guard on the
    // parsed AST so a project with frontmatter only doesn't print a bare heading.
    const hasWriteup = computed(() => {
        const body = project.value?.body as { value?: unknown[] } | undefined
        return Boolean(body?.value?.length)
    })

    const config = useRuntimeConfig()
    const siteUrl = (config.public.siteUrl as string).replace(/\/$/, '')

    // Image used when a project link is unfurled by Slack, Discord, X, iMessage and
    // friends. Without one these fall back to the site icon, so every project embed
    // looked identical. Explicit ogImage wins, then a screenshot, then the project's
    // own app icon. SVG icons are skipped deliberately: no major unfurler renders an
    // SVG og:image, so those projects point ogImage at a rasterised copy instead.
    const embedImage = computed(() => {
        const p = project.value
        if (!p) return undefined
        const icon = p.iconImage && !p.iconImage.toLowerCase().endsWith('.svg') ? p.iconImage : undefined
        return p.ogImage || p.screenshots?.[0]?.src || icon
    })

    const absoluteUrl = (src: string) =>
        /^https?:\/\//.test(src) ? src : `${siteUrl}${src.startsWith('/') ? src : `/${src}`}`

    useSiteSeo(() => {
        const p = project.value
        return {
            title: p?.title,
            description: p?.tag,
            image: embedImage.value,
            imageAlt: p ? `${p.title}, ${p.tag}` : undefined,
            type: 'article',
            publishedTime: p?.date,
            section: p?.type,
            tags: p?.platforms,
            author: config.public.siteAuthor as string
        }
    })

    useHead(() => {
        const p = project.value
        if (!p) return {}
        const resolved = embedImage.value
        const image = resolved ? absoluteUrl(resolved) : `${siteUrl}${config.public.defaultOgImage as string}`
        const url = `${siteUrl}/projects/${route.params.slug}`
        const sameAs = (p.links || []).map(l => l.href).filter(Boolean)
        const ldJson = {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: p.title,
            description: p.tag,
            url,
            image,
            applicationCategory: p.type,
            operatingSystem: (p.platforms || []).join(', ') || undefined,
            datePublished: p.date,
            author: {
                '@type': 'Person',
                name: config.public.siteAuthor as string,
                url: siteUrl
            },
            ...(sameAs.length ? { sameAs } : {})
        }
        return {
            script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(ldJson) }]
        }
    })

    useScrollReveal()
</script>
