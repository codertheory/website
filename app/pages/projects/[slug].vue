<template>
  <div v-if="project" class="page">
    <section class="wrap detail-body">
      <div class="detail-grid">
        <header class="detail-hero">
          <div class="crumb">
            <NuxtLink to="/projects">Projects</NuxtLink>
            <span>/</span>
            <span>{{ project.title }}</span>
          </div>
          <div class="detail-status">
            <!-- Same icon as the project's row, and the element that row's icon travels to. -->
            <div
              :class="['proj-thumb', 'prow-thumb', 'detail-icon', `tone-${project.tone || 'blue'}`]"
              :style="{ viewTransitionName: `proj-icon-${route.params.slug}` }"
            >
              <div :class="['icon-mark', { 'icon-mark--img': project.iconImage && !project.iconImageTile, 'icon-mark--tile': project.iconImage && project.iconImageTile }]">
                <ProjectIcon :image="project.iconImage" :image-dark="project.iconImageDark" :glyph="project.icon" alt="" />
              </div>
            </div>
            <span class="spin-tag">
              <span :class="['dot', `dot--${project.status}`]" /> {{ project.statusLabel }}
            </span>
            <span class="chip">{{ project.type }}</span>
          </div>
          <h1 class="h-display detail-title" :style="{ viewTransitionName: `proj-title-${route.params.slug}` }">{{ project.title }}</h1>
          <p class="detail-tag">{{ project.tag }}</p>
          <div v-if="heroLinks.length" class="detail-ctas">
            <a
              v-for="(l, i) in heroLinks"
              :key="l.href"
              :class="['btn', i === 0 ? 'btn--primary' : 'btn--ghost']"
              :href="l.href"
            >
              {{ l.label }} <ExternalIcon />
            </a>
          </div>
        </header>

        <!-- Real evidence leads: screenshots when a project has them, otherwise a
             figure it names. With neither, the page goes straight to the writing. -->
        <div v-if="project.screenshots?.length" class="detail-shots">
          <div class="shots-strip">
            <div v-for="(shot, i) in project.screenshots" :key="i" class="shot">
              <NuxtImg :src="shot.src" :alt="shot.alt || `${project.title} screenshot ${i + 1}`" />
            </div>
          </div>
        </div>
        <div v-else-if="project.leadFigure === 'pipeline-flow'" class="detail-lead">
          <PipelineFlow />
        </div>

        <div v-if="project.why" class="story-block">
          <span class="eyebrow">Why I built it</span>
          <div class="body">
            <p>
              <template v-for="(seg, i) in whySegments" :key="i">
                <em v-if="seg.em">{{ seg.text }}</em>
                <template v-else>{{ seg.text }}</template>
              </template>
            </p>
          </div>
        </div>

        <div v-if="project.features?.length" class="detail-inside">
          <h2 class="detail-h2">What's inside</h2>
          <p class="detail-lede">The features I'd actually point a friend to.</p>
          <ul class="detail-features">
            <li v-for="(f, i) in project.features" :key="i">
              <span class="num">{{ padNum(i + 1) }}</span>
              <div>
                <b>{{ f.t }}</b>
                <span>{{ f.d }}</span>
              </div>
            </li>
          </ul>
        </div>

        <aside class="card detail-side" aria-label="At a glance">
          <h2 class="detail-side-h">At a glance</h2>
          <div class="row"><span class="k">platform</span><span class="v">{{ (project.platforms || []).join(', ') }}</span></div>
          <div class="row"><span class="k">started</span><span class="v">{{ project.started }}</span></div>

          <h2 class="detail-side-h">Stack</h2>
          <div class="stack-chips">
            <span v-for="s in (project.stack || [])" :key="s" class="chip">{{ s }}</span>
          </div>

          <template v-if="sideLinks.length">
            <h2 class="detail-side-h">Links</h2>
            <div class="detail-links">
              <a v-for="(l, i) in sideLinks" :key="i" :href="l.href">
                <span>{{ l.label }}</span>
                <ExternalIcon />
              </a>
            </div>
          </template>
        </aside>

        <div v-if="hasWriteup" class="project-writeup">
          <span class="eyebrow">In depth</span>
          <article class="prose">
            <ContentRenderer :value="project" />
          </article>
        </div>
      </div>
    </section>

    <nav v-if="prevProject && nextProject" class="wrap project-nav" aria-label="More projects">
      <NuxtLink class="project-nav__item" :to="`/projects/${slugFromPath(prevProject.path)}`">
        <span class="dir">// previous</span>
        <span class="title" :style="{ viewTransitionName: `proj-title-${slugFromPath(prevProject.path)}` }">{{ prevProject.title }}</span>
        <span class="tag">{{ prevProject.tag }}</span>
      </NuxtLink>
      <NuxtLink class="project-nav__item project-nav__item--next" :to="`/projects/${slugFromPath(nextProject.path)}`">
        <span class="dir">// next</span>
        <span class="title" :style="{ viewTransitionName: `proj-title-${slugFromPath(nextProject.path)}` }">{{ nextProject.title }}</span>
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

    // Every way to use the thing (play it, install it) sits in the header, where
    // a visitor who came for the product sees it first. A project with no such
    // link shows its first link instead, which is usually the code.
    const heroLinks = computed(() => {
        const links = project.value?.links || []
        const ways = links.filter(l => l.kind === 'site' || l.kind === 'store')
        return ways.length ? ways : links.slice(0, 1)
    })
    // The side card lists only what the header has not already offered.
    const sideLinks = computed(() =>
        (project.value?.links || []).filter(l => !heroLinks.value.some(h => h.href === l.href))
    )

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
    // rendered, so every project's long-form writeup was invisible.
    //
    // Guard on whether the body actually has words in it, not on whether the
    // parsed array is non-empty. A body can be present and still render to
    // nothing (an HTML comment, stray blank lines), and an "In depth" heading
    // with silence underneath is worse than no heading.
    const hasWriteup = computed(() => countWords(project.value) > 0)

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
        // Discord renders this instead of the standard card when it can. The
        // meta tags above stay the authority for every other platform, and for
        // Discord whenever the payload can't be used.
        const embed = buildProjectEmbed({
            title: p.title,
            tag: p.tag,
            url,
            image,
            statusLabel: p.statusLabel,
            platforms: p.platforms,
            stack: p.stack,
            links: p.links
        })

        const scripts: Array<Record<string, string>> = [
            { type: 'application/ld+json', innerHTML: JSON.stringify(ldJson) }
        ]
        if (embed) {
            const body = serialiseEmbed(embed)
            // Past the size cap Discord drops the payload, so fall back to the
            // standard preview rather than shipping something it will reject.
            if (new TextEncoder().encode(body).length <= DISCORD_MAX_BYTES) {
                scripts.push({ id: 'discord:component-embed', type: 'application/json', innerHTML: body })
            }
        }

        return { script: scripts }
    })

    useScrollReveal()
</script>
