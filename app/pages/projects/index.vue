<template>
  <div class="page">
    <section class="wrap" style="padding-top: 60px;">
      <span class="eyebrow">Projects</span>
      <h1 class="h-section" style="margin-top: 14px; max-width: 760px;">
        Things I've shipped, in <span class="scribble">all shapes<ScribbleUnder /></span>. Apps, scripts, bots, tools.
      </h1>
      <p style="max-width: 600px; color: var(--ink-soft); margin-top: 14px; font-size: 18px;">
        Some are alive and growing, some are sleeping peacefully. They all taught me something worth keeping.
      </p>
    </section>

    <section class="wrap proj-index">
      <div class="proj-filters">
        <button
          v-for="f in platformFilters"
          :key="f"
          :class="['proj-filter', { 'is-active': platform === f }]"
          :aria-pressed="platform === f"
          @click="platform = f"
        >
          {{ f }}
        </button>
        <span class="proj-filter-spacer" />
        <span class="proj-filter-count">
          {{ filteredProjects.length }} {{ filteredProjects.length === 1 ? 'project' : 'projects' }}
        </span>
      </div>

      <EmptyDirectory v-if="(projects || []).length === 0" kind="projects" />
      <EmptyFilter
        v-else-if="filteredProjects.length === 0"
        :filter="platform"
        :filters="platformFilters"
        kind="projects"
        @update:filter="platform = $event"
      />
      <ul v-else class="prow-list">
        <li v-for="p in filteredProjects" :key="p.path">
          <ProjectRow :project="p" show-stack />
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
    const { data: projects } = await useAsyncData('projects-index', () =>
        queryCollection('projects').order('date', 'DESC').all()
    )

    const PLATFORM_FILTERS = ['All', 'iOS', 'Web', 'Desktop', 'CLI', 'Bot'] as const

    // Only offer a platform that at least one project answers to.
    const matchesPlatform = (p: { platforms?: string[], type?: string }, f: string) =>
        (p.platforms || []).some(pl => pl.toLowerCase() === f) || (p.type || '').toLowerCase().includes(f)
    const platformFilters = computed<string[]>(() =>
        PLATFORM_FILTERS.filter(f => f === 'All' || (projects.value || []).some(p => matchesPlatform(p, f.toLowerCase())))
    )

    // The filter lives in the URL so Back from a project returns to the same
    // list. Anything the URL carries that is not a real filter means "All".
    const route = useRoute()
    const router = useRouter()
    const fromQuery = (v: unknown) =>
        (typeof v === 'string' && platformFilters.value.includes(v) ? v : 'All')
    const platform = ref<string>(fromQuery(route.query.platform))
    watch(platform, (pl) => {
        router.replace({ query: pl !== 'All' ? { platform: pl } : {} })
    })

    const filteredProjects = computed(() => {
        const items = projects.value || []
        if (platform.value === 'All') return items
        const f = platform.value.toLowerCase()
        return items.filter(p => matchesPlatform(p, f))
    })

    useSiteSeo({
        title: 'Projects',
        description: "Things Lucas has shipped. Apps, scripts, bots and tools, some alive and growing, some sleeping peacefully."
    })

</script>
