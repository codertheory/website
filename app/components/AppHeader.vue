<template>
  <header class="nav">
    <div class="nav-inner">
      <NuxtLink to="/" class="brand">
        <span class="brand-mark"><BrandLogo :size="36" /></span>
        <b>codertheory</b>
        <span>.dev</span>
      </NuxtLink>

      <nav class="nav-links">
        <NuxtLink
          v-for="n in NAV"
          :key="n.id"
          :to="n.path"
          :class="['nav-link', { 'is-active': isActive(n.path) }]"
        >
          {{ n.label }}
        </NuxtLink>
        <button class="icon-btn" aria-label="Toggle theme" @click="toggle">
          <SunIcon v-if="theme === 'dark'" />
          <MoonIcon v-else />
        </button>
      </nav>

      <div class="nav-mobile-actions">
        <button class="icon-btn" aria-label="Toggle theme" @click="toggle">
          <SunIcon v-if="theme === 'dark'" />
          <MoonIcon v-else />
        </button>
        <button
          ref="menuButton"
          :class="['hamburger', { 'is-open': open }]"
          aria-label="Menu"
          aria-controls="nav-drawer"
          :aria-expanded="open"
          @click="open = !open"
        >
          <span /><span /><span />
        </button>
      </div>
    </div>

    <!-- Closed means out of the tab order and the accessibility tree, not just transparent. -->
    <nav id="nav-drawer" :class="['nav-drawer', { 'is-open': open }]" :inert="!open" aria-label="Menu">
      <NuxtLink
        v-for="n in NAV"
        :key="n.id"
        :to="n.path"
        :class="['nav-drawer-link', { 'is-active': isActive(n.path) }]"
      >
        {{ n.label }}
      </NuxtLink>
    </nav>
  </header>
</template>

<script setup lang="ts">
    const route = useRoute()
    const { theme, toggle } = useTheme()
    // Shared so the layout can take the page behind the open menu out of the
    // tab order; otherwise Tab walks off the last menu link into covered content.
    const open = useState('nav-open', () => false)
    const menuButton = ref<HTMLButtonElement>()

    const onKeydown = (e: KeyboardEvent) => {
        if (e.key !== 'Escape' || !open.value) return
        open.value = false
        menuButton.value?.focus()
    }
    onMounted(() => window.addEventListener('keydown', onKeydown))

    const NAV = [
        { id: 'home', label: 'Home', path: '/' },
        { id: 'projects', label: 'Projects', path: '/projects' },
        { id: 'blog', label: 'Blog', path: '/blog' },
        { id: 'about', label: 'About', path: '/about' },
        { id: 'contact', label: 'Contact', path: '/contact' }
    ] as const

    const isActive = (path: string) => {
        if (path === '/') return route.path === '/'
        return route.path.startsWith(path)
    }

    watch(() => route.fullPath, () => { open.value = false })

    watch(open, (isOpen) => {
        if (import.meta.client) {
            document.body.style.overflow = isOpen ? 'hidden' : ''
        }
    })

    onUnmounted(() => {
        if (!import.meta.client) return
        document.body.style.overflow = ''
        window.removeEventListener('keydown', onKeydown)
    })
</script>
