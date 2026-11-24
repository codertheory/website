<template>
  <footer class="footer">
    <div class="footer-inner">
      <NuxtLink to="/" class="brand footer-brand">
        <span class="brand-mark"><BrandLogo :size="24" /></span>
        <b>codertheory</b>
      </NuxtLink>
      <nav class="footer-links" aria-label="More pages">
        <template v-for="l in links" :key="l.label">
          <NuxtLink v-if="'to' in l" :to="l.to">{{ l.label }}</NuxtLink>
          <a v-else :href="l.href"><TechIcon :icon="l.icon" />{{ l.label }}</a>
        </template>
      </nav>
      <span class="footer-copy">© 2026</span>
    </div>
  </footer>
</template>

<script setup lang="ts">
    import { UI_ICONS } from '~/data/icons'

    // The header carries the main pages; these are the ones only reachable from here.
    const links = [
        { label: 'Now', to: '/now' },
        { label: 'Uses', to: '/uses' },
        { label: 'Search', to: '/search' },
        { label: 'Privacy', to: '/privacy' },
        { label: 'Terms', to: '/terms' },
        { label: 'GitHub', href: 'https://github.com/codertheory/', icon: UI_ICONS.github }
    ] as const
</script>
