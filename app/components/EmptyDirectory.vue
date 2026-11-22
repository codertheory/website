<template>
  <div class="es-block">
    <TerminalPanel :label="`~ /codertheory/${copy.dir}`" :lines="lines" />
    <h2>{{ copy.headline }}</h2>
    <p class="body">{{ copy.body }}</p>
    <div class="es-ctas">
      <NuxtLink class="btn btn--primary" :to="copy.primary.to">
        {{ copy.primary.label }} <ArrowRight />
      </NuxtLink>
      <NuxtLink class="btn btn--ghost" :to="copy.secondary.to">
        {{ copy.secondary.label }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
    import type { TerminalLine } from './TerminalPanel.vue'

    const props = defineProps<{ kind: 'projects' | 'blog' }>()

    const COPY = {
        projects: {
            dir: 'projects',
            arg: './projects',
            comment: "# nothing shipped yet, and that's fine.",
            headline: 'An empty directory is honest.',
            body: "I'd rather show you nothing than ship filler. The next thing is in progress and usually closer than it looks.",
            primary: { to: '/blog', label: 'Read recent posts' },
            secondary: { to: '/about', label: "What I'm doing now" }
        },
        blog: {
            dir: 'blog',
            arg: './posts',
            comment: '# no posts yet, drafts in ~/notebooks.',
            headline: 'An empty page is also a page.',
            body: "I write less and re-read more than I'd like to admit. New posts arrive when they're actually worth your time.",
            primary: { to: '/projects', label: 'Browse projects' },
            secondary: { to: '/about', label: "What I'm doing now" }
        }
    } as const

    const copy = computed(() => COPY[props.kind])

    // What `ls -la` prints for an empty folder: itself and its parent.
    const lines = computed<TerminalLine[]>(() => [
        { kind: 'cmd', text: 'ls -la', arg: copy.value.arg },
        { kind: 'out', text: 'total 0' },
        { kind: 'out', text: 'drwxr-xr-x   2 lucas  staff   64 May  7  2026 .' },
        { kind: 'out', text: 'drwxr-xr-x  14 lucas  staff  448 May  7  2026 ..' },
        { kind: 'cmt', text: copy.value.comment }
    ])
</script>
