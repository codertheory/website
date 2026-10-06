<template>
  <article :class="['prow', { 'prow--compact': compact, 'prow--figure': $slots.figure }]">
    <div :class="['proj-thumb', 'prow-thumb', `tone-${project.tone || 'blue'}`]" :style="inTransit ? { viewTransitionName: 'proj-icon' } : undefined">
      <div :class="['icon-mark', { 'icon-mark--img': project.iconImage && !project.iconImageTile, 'icon-mark--tile': project.iconImage && project.iconImageTile }]">
        <ProjectIcon :image="project.iconImage" :image-dark="project.iconImageDark" :glyph="project.icon" alt="" />
      </div>
    </div>
    <div class="prow-body">
      <div class="prow-head">
        <component :is="heading" class="prow-title" :style="inTransit ? { viewTransitionName: 'proj-title' } : undefined">
          <NuxtLink class="prow-link" :to="`/projects/${slug}`">{{ project.title }}</NuxtLink>
        </component>
        <span class="prow-status">
          <span :class="['dot', `dot--${project.status}`]" aria-hidden="true" />
          {{ project.statusLabel }}
        </span>
      </div>
      <p v-if="!compact" class="prow-tag">{{ project.tag }}</p>
      <p class="prow-meta">
        <span>{{ (project.platforms || []).join(' · ') }}</span>
        <a v-if="external" class="prow-ext" :href="external.href">
          {{ external.label }} <ExternalIcon :size="12" />
        </a>
      </p>
      <p v-if="showStack && project.stack?.length" class="prow-stack">{{ project.stack.join(' · ') }}</p>
    </div>
    <div v-if="$slots.figure" class="prow-figure" aria-hidden="true">
      <slot name="figure" />
    </div>
    <span class="prow-arrow" aria-hidden="true"><ArrowRight :size="compact ? 16 : 18" /></span>
  </article>
</template>

<script setup lang="ts">
    type ProjectLink = { label: string, href: string, kind?: string }
    type Project = {
        path?: string
        title: string
        tag: string
        status?: string
        statusLabel?: string
        platforms?: string[]
        stack?: string[]
        tone?: string
        icon?: string
        iconImage?: string
        iconImageDark?: string
        iconImageTile?: boolean
        links?: ProjectLink[]
    }

    const props = withDefaults(defineProps<{
        project: Project
        compact?: boolean
        showStack?: boolean
        heading?: 'h2' | 'h3'
    }>(), { compact: false, showStack: false, heading: 'h2' })

    const slug = computed(() => (props.project.path || '').split('/').filter(Boolean).pop() || '')

    // Only the row for the project being opened (or just left) shares its icon
    // and title with the project page. Naming every row made each one fade as
    // its own layer on every navigation, out of step with the page.
    const transitProject = useState<string | null>('transit-project', () => null)
    const inTransit = computed(() => transitProject.value === slug.value)

    // The whole row opens the project page. The one link that leaves the site
    // (play it, get it) sits on top as its own target, so someone who came for
    // the product does not need the detail page to find the door.
    const external = computed(() =>
        (props.project.links || []).find(l => l.kind === 'site' || l.kind === 'store') || null
    )
</script>
