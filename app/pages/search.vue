<template>
  <div class="page">
    <section class="wrap-narrow" style="padding-top: 60px;">
      <span class="eyebrow">Search</span>
      <h1 class="h-section" style="margin-top: 14px;">
        Look through <span class="scribble">everything<ScribbleUnder /></span> here.
      </h1>

      <div class="search-box">
        <input
          ref="input"
          v-model="q"
          type="search"
          class="search-input"
          placeholder="Try swift, realtime, discord…"
          aria-label="Search projects and writing"
          autocomplete="off"
        >
        <span class="search-count">{{ results.length }} {{ results.length === 1 ? 'result' : 'results' }}</span>
      </div>
    </section>

    <section class="wrap-narrow search-results">
      <p v-if="!q.trim()" class="search-hint">
        Searching {{ projects?.length || 0 }} projects and {{ posts?.length || 0 }} posts by title,
        description, tech and topic.
      </p>

      <p v-else-if="results.length === 0" class="search-hint">
        Nothing matches <b>{{ q }}</b>. Try a language, a platform, or a project name.
      </p>

      <NuxtLink
        v-for="r in results"
        :key="r.href"
        :to="r.href"
        class="search-hit"
      >
        <span class="kind">{{ r.kind }}</span>
        <span class="title">{{ r.title }}</span>
        <span class="sub">{{ r.sub }}</span>
        <span v-if="r.tags.length" class="tags">
          <span v-for="t in r.tags" :key="t" class="chip">{{ t }}</span>
        </span>
      </NuxtLink>
    </section>
  </div>
</template>

<script setup lang="ts">
    type Hit = { href: string, kind: string, title: string, sub: string, tags: string[], haystack: string }

    const route = useRoute()
    const router = useRouter()
    const q = ref(typeof route.query.q === 'string' ? route.query.q : '')
    const input = ref<HTMLInputElement | null>(null)

    const slugOf = (path: string | undefined) => (path || '').split('/').filter(Boolean).pop() || ''

    const { data: projects } = await useAsyncData('search-projects', () =>
        queryCollection('projects').order('date', 'DESC').all()
    )
    const { data: posts } = await useAsyncData('search-posts', () =>
        queryCollection('news').order('date', 'DESC').all()
    )

    // Built from frontmatter only. The markdown bodies would make matches better
    // but would also ship every project's full text to the client on page load.
    const index = computed<Hit[]>(() => {
        const fromProjects = (projects.value || []).map(p => {
            const tags = [...(p.platforms || []), ...(p.stack || [])]
            return {
                href: `/projects/${slugOf(p.path)}`,
                kind: 'project',
                title: p.title,
                sub: p.tag,
                tags: (p.stack || []).slice(0, 4),
                haystack: [p.title, p.tag, p.type, p.statusLabel, ...tags].join(' ').toLowerCase()
            }
        })
        const fromPosts = (posts.value || []).map(p => ({
            href: `/blog/${slugOf(p.path)}`,
            kind: 'writing',
            title: p.title,
            sub: p.excerpt,
            tags: p.cat ? [p.cat] : [],
            haystack: [p.title, p.excerpt, p.cat].join(' ').toLowerCase()
        }))
        return [...fromProjects, ...fromPosts]
    })

    // Every term has to match somewhere, so "swift mac" narrows instead of widening.
    const results = computed(() => {
        const terms = q.value.toLowerCase().split(/\s+/).filter(Boolean)
        if (terms.length === 0) return index.value
        return index.value.filter(hit => terms.every(t => hit.haystack.includes(t)))
    })

    // Keep the URL shareable without stacking history entries on every keystroke.
    watch(q, value => {
        router.replace({query: value.trim() ? {q: value.trim()} : {}})
    })

    onMounted(() => input.value?.focus())

    useSiteSeo({
        title: 'Search',
        description: 'Search projects and writing on codertheory.',
        noindex: true
    })
</script>
