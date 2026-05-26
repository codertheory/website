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
          v-for="f in FILTERS"
          :key="f"
          :class="['proj-filter', { 'is-active': filter === f }]"
          @click="filter = f"
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
        v-model:filter="filter"
        :filters="FILTERS"
        kind="projects"
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

    const FILTERS = ['All', 'iOS', 'Web', 'Desktop', 'CLI', 'Bot'] as const
    type Filter = typeof FILTERS[number]
    const filter = ref<Filter>('All')

    const filteredProjects = computed(() => {
        const items = projects.value || []
        if (filter.value === 'All') return items
        const f = filter.value.toLowerCase()
        return items.filter(p =>
            (p.platforms || []).some(pl => pl.toLowerCase() === f) ||
            (p.type || '').toLowerCase().includes(f)
        )
    })

    useSiteSeo({
        title: 'Projects',
        description: "Things Lucas has shipped — apps, scripts, bots, and tools. Some alive and growing, some sleeping peacefully."
    })

    useScrollReveal(filter)
</script>
