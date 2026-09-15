<template>
  <div class="page">
    <section class="wrap" style="padding-top: 60px;">
      <span class="eyebrow">Projects</span>
      <h1 class="h-section" style="margin-top: 14px; max-width: 760px;">
        Things I've shipped, in <span class="scribble">all shapes<ScribbleUnder /></span> — apps, scripts, bots, tools.
      </h1>
      <p style="max-width: 600px; color: var(--ink-soft); margin-top: 14px; font-size: 18px;">
        Some are alive and growing, some are sleeping peacefully. They all taught me something worth keeping.
      </p>
    </section>

    <section class="wrap" style="margin-top: 36px; padding-top: 24px; padding-bottom: 80px;">
      <div class="proj-filters">
        <button
          v-for="f in PLATFORM_FILTERS"
          :key="f"
          :class="['proj-filter', { 'is-active': platform === f }]"
          @click="platform = f"
        >
          {{ f }}
        </button>
        <span class="proj-filter-spacer" />
        <span class="proj-filter-count">
          {{ filteredProjects.length }} {{ filteredProjects.length === 1 ? 'project' : 'projects' }}
        </span>
      </div>

      <div class="proj-filters proj-filters--tech">
        <span class="proj-filter-label">tech</span>
        <button
          v-for="t in techFilters"
          :key="t"
          :class="['proj-filter', 'proj-filter--tech', { 'is-active': tech === t }]"
          @click="tech = t"
        >
          {{ t }}
        </button>
      </div>

      <EmptyDirectory v-if="(projects || []).length === 0" kind="projects" />
      <EmptyFilter
        v-else-if="filteredProjects.length === 0"
        :filter="activeLabel"
        :filters="allFilters"
        kind="projects"
        @update:filter="applyFilter"
      />
      <div v-else>
        <NuxtLink
          v-for="p in filteredProjects"
          :key="p.path"
          :to="`/projects/${slugFromPath(p.path)}`"
          class="proj-row fade-up"
        >
          <div :class="['proj-thumb', `tone-${p.tone || 'blue'}`]">
            <div :class="['icon-mark', { 'icon-mark--img': p.iconImage && !p.iconImageTile, 'icon-mark--tile': p.iconImage && p.iconImageTile }]">
              <ProjectIcon :image="p.iconImage" :image-dark="p.iconImageDark" :glyph="p.icon" :alt="`${p.title} icon`" />
            </div>
          </div>
          <div>
            <div class="proj-meta">
              <span :class="['dot', `dot--${p.status}`]" />
              <span class="label">{{ p.statusLabel }}</span>
              <span class="sep">·</span>
              <span class="platforms">{{ (p.platforms || []).join(' · ') }}</span>
            </div>
            <h3 class="proj-title">{{ p.title }}</h3>
            <p class="proj-tag">{{ p.tag }}</p>
            <div class="proj-stack">
              <span v-for="s in (p.stack || [])" :key="s" class="chip">{{ s }}</span>
            </div>
          </div>
          <div class="proj-cta">
            <span>open →</span>
            <span class="arrow"><ArrowRight :size="20" /></span>
          </div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
    const slugFromPath = (path: string | undefined) => (path || '').split('/').filter(Boolean).pop() || ''

    const { data: projects } = await useAsyncData('projects-index', () =>
        queryCollection('projects').order('date', 'DESC').all()
    )

    const PLATFORM_FILTERS = ['All', 'iOS', 'Web', 'Desktop', 'CLI', 'Bot'] as const
    const platform = ref<string>('All')
    const tech = ref<string>('All')

    // Derived from the projects themselves so the row stays correct as the stack
    // lists change, rather than being a second hardcoded list to keep in step.
    const techFilters = computed(() => {
        const seen = new Set<string>()
        for (const p of projects.value || []) {
            for (const entry of (p.stack || [])) seen.add(entry)
        }
        return ['All', ...[...seen].sort((a, b) => a.localeCompare(b))]
    })

    const filteredProjects = computed(() => {
        let items = projects.value || []
        if (platform.value !== 'All') {
            const f = platform.value.toLowerCase()
            items = items.filter(p =>
                (p.platforms || []).some(pl => pl.toLowerCase() === f) ||
                (p.type || '').toLowerCase().includes(f)
            )
        }
        if (tech.value !== 'All') {
            items = items.filter(p => (p.stack || []).includes(tech.value))
        }
        return items
    })

    // EmptyFilter speaks in a single label, so show whichever dimension is narrower
    // and route its "try instead" chips back to the row they came from.
    const activeLabel = computed(() => (tech.value !== 'All' ? tech.value : platform.value))
    const allFilters = computed(() => [...PLATFORM_FILTERS, ...techFilters.value.slice(1)])

    const applyFilter = (value: string) => {
        if (value === 'All') {
            platform.value = 'All'
            tech.value = 'All'
        } else if (techFilters.value.includes(value)) {
            tech.value = value
        } else {
            platform.value = value
        }
    }

    useSiteSeo({
        title: 'Projects',
        description: "Things Lucas has shipped — apps, scripts, bots, and tools. Some alive and growing, some sleeping peacefully."
    })

    useScrollReveal(filteredProjects)
</script>
