<template>
  <div class="es-block">
    <h2>{{ copy.headline }}</h2>
    <p class="body">{{ copy.body }}</p>
    <div class="es-ctas">
      <NuxtLink class="btn btn--primary" :to="copy.primary.to">
        {{ copy.primary.label }} <ArrowRight :size="14" />
      </NuxtLink>
      <NuxtLink class="btn btn--ghost" :to="copy.secondary.to">
        {{ copy.secondary.label }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
    const props = defineProps<{ kind: 'projects' | 'blog' }>()

    const COPY = {
        projects: {
            headline: 'An empty directory is honest.',
            body: "I'd rather show you nothing than ship filler. The next thing is in progress and usually closer than it looks.",
            primary: { to: '/blog', label: 'Read recent posts' },
            secondary: { to: '/about', label: "What I'm doing now" }
        },
        blog: {
            headline: 'An empty page is also a page.',
            body: "I write less and re-read more than I'd like to admit. New posts arrive when they're actually worth your time.",
            primary: { to: '/projects', label: 'Browse projects' },
            secondary: { to: '/about', label: "What I'm doing now" }
        }
    } as const

    const copy = computed(() => COPY[props.kind])
</script>
