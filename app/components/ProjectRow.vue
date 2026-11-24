<template>
  <article :class="['prow', { 'prow--compact': compact, 'prow--figure': $slots.figure }]">
    <div :class="['proj-thumb', 'prow-thumb']" :style="inTransit ? { viewTransitionName: 'proj-icon' } : undefined">
      <div :class="['icon-mark', { 'icon-mark--img': project.iconImage && !project.iconImageTile, 'icon-mark--tile': project.iconImage && project.iconImageTile }]">
        <ProjectIcon :image="project.iconImage" :image-dark="project.iconImageDark" :glyph="project.icon" alt="" />
      </div>
    </div>
    <div class="prow-body">
      <div class="prow-head">
        <component :is="heading" class="prow-title" :style="inTransit ? { viewTransitionName: 'proj-title' } : undefined">
          <NuxtLink class="prow-link" :to="`/projects/${slug}`">{{ project.title }}</NuxtLink>
        </component>
        <span v-if="(project.status !== 'active' && project.statusLabel) || (showYear && year)" class="prow-aside">
          <!-- "Active" is the normal case, so only the exceptions are labelled. -->
          <span v-if="project.status !== 'active' && project.statusLabel" class="prow-status">
            <span :class="['dot', `dot--${project.status}`]" aria-hidden="true" />
            {{ project.statusLabel }}
          </span>
          <span v-if="showYear && year" class="prow-year">{{ year }}</span>
        </span>
      </div>
      <p v-if="!compact" class="prow-tag">{{ project.tag }}</p>
      <p class="prow-meta">
        <span class="icon-list">
          <span v-for="pl in (project.platforms || [])" :key="pl" class="icon-item"><TechIcon :name="pl" />{{ pl }}</span>
        </span>
        <a v-if="external" class="prow-ext" :href="external.href">
          <TechIcon :icon="linkIcon(external)" /> {{ external.label }} <ExternalIcon />
        </a>
      </p>
      <p v-if="showStack && project.stack?.length" class="prow-stack icon-list">
        <span v-for="s in project.stack" :key="s" class="icon-item"><TechIcon :name="s" />{{ s }}</span>
      </p>
    </div>
    <div v-if="$slots.figure" class="prow-figure" aria-hidden="true">
      <slot name="figure" />
    </div>
    <span class="prow-arrow" aria-hidden="true"><ArrowRight /></span>
  </article>
</template>

<script setup lang="ts">
    import { linkIcon } from '~/data/icons'

    type ProjectLink = { label: string, href: string, kind?: string }
    type Project = {
        path?: string
        title: string
        tag: string
        date?: string
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
        showYear?: boolean
        heading?: 'h2' | 'h3'
    }>(), { compact: false, showStack: false, showYear: false, heading: 'h2' })

    const year = computed(() => {
        const y = new Date(props.project.date || '').getUTCFullYear()
        return Number.isNaN(y) ? '' : String(y)
    })

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
        (props.project.links || []).find(l => (l.kind === 'site' || l.kind === 'store') && /^https?:\/\//.test(l.href)) || null
    )
</script>
