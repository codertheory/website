<template>
  <div class="es-block">
    <!-- The blog's empty state is a terminal listing the empty posts folder. -->
    <div v-if="copy.term" class="term" aria-hidden="true">
      <div class="term-bar">
        <span class="tdot tdot--close" />
        <span class="tdot tdot--min" />
        <span class="tdot tdot--max" />
        <span class="term-label">{{ copy.term.label }}</span>
      </div>
      <div class="term-body">
        <div><span class="pmpt">$</span> ls -la <span class="arg">{{ copy.term.arg }}</span></div>
        <div class="dim term-gap-sm">total 0</div>
        <!-- Interpolated so the template compiler keeps the column spacing. -->
        <div v-for="line in LISTING" :key="line" class="dim">{{ line }}</div>
        <div class="term-gap"><span class="cmt">{{ copy.term.comment }}</span></div>
        <div class="term-gap-sm"><span class="pmpt">$</span> <span class="blink" /></div>
      </div>
    </div>
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
    const props = defineProps<{ kind: 'projects' | 'blog' }>()

    const COPY = {
        projects: {
            term: null,
            headline: 'An empty directory is honest.',
            body: "I'd rather show you nothing than ship filler. The next thing is in progress and usually closer than it looks.",
            primary: { to: '/blog', label: 'Read recent posts' },
            secondary: { to: '/about', label: "What I'm doing now" }
        },
        blog: {
            term: {
                label: '~ /codertheory/blog',
                arg: './posts',
                comment: '# no posts yet, drafts in ~/notebooks.'
            },
            headline: 'An empty page is also a page.',
            body: "I write less and re-read more than I'd like to admit. New posts arrive when they're actually worth your time.",
            primary: { to: '/projects', label: 'Browse projects' },
            secondary: { to: '/about', label: "What I'm doing now" }
        }
    } as const

    const copy = computed(() => COPY[props.kind])

    // What `ls -la` prints for an empty folder: itself and its parent.
    const LISTING = [
        'drwxr-xr-x   2 lucas  staff   64 May  7  2026 .',
        'drwxr-xr-x  14 lucas  staff  448 May  7  2026 ..'
    ]
</script>
