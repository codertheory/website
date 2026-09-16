<template>
  <footer class="footer">
    <div class="footer-inner">
      <div>
        <NuxtLink to="/" class="brand">
          <span class="brand-mark"><BrandLogo :size="32" /></span>
          <b>codertheory</b>
        </NuxtLink>
        <p class="footer-tagline">Software, writing, and the ideas behind them — by Lucas.</p>
      </div>
      <div v-for="c in cols" :key="c.h" class="footer-col">
        <h5>{{ c.h }}</h5>
        <ul>
          <li v-for="l in c.links" :key="l.label">
            <NuxtLink v-if="'to' in l" :to="l.to">{{ l.label }}</NuxtLink>
            <a v-else :href="l.href">{{ l.label }}</a>
          </li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 codertheory.dev</span>
      <span>// built with care, deployed on cloudflare</span>
    </div>
  </footer>
</template>

<script setup lang="ts">
    const cols = [
        {
            h: 'Site',
            links: [
                { label: 'Home', to: '/' },
                { label: 'Projects', to: '/projects' },
                { label: 'Blog', to: '/blog' },
                { label: 'About', to: '/about' },
                { label: 'Now', to: '/now' },
                { label: 'Uses', to: '/uses' },
                { label: 'Search', to: '/search' }
            ]
        },
        {
            h: 'Contact',
            links: [
                { label: 'Get in touch', to: '/contact' },
                { label: 'Latest writing', to: '/blog' },
                { label: 'GitHub', href: 'https://github.com/codertheory/' }
            ]
        },
        {
            h: 'Legal',
            links: [
                { label: 'Privacy', to: '/privacy' },
                { label: 'Terms', to: '/terms' }
            ]
        }
    ] as const
</script>
