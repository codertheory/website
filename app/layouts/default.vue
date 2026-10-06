<template>
  <div class="shell">
    <a class="skip-link" href="#main">Skip to content</a>
    <AppHeader />
    <main id="main" tabindex="-1" :inert="navOpen">
      <slot />
    </main>
    <AppFooter :inert="navOpen" />
  </div>
</template>

<script setup lang="ts">
    const navOpen = useState('nav-open', () => false)
</script>
