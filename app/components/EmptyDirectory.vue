<template>
  <div class="es-v2 fade-up">
    <div class="term">
      <div class="term-bar">
        <span class="tdot" style="background:#FF5F57" />
        <span class="tdot" style="background:#FEBC2E" />
        <span class="tdot" style="background:#28C840" />
        <span class="label">{{ copy.label }}</span>
      </div>
      <div class="term-body">
        <div><span class="pmpt">$</span> ls -la <span class="arg">{{ copy.arg }}</span></div>
        <div class="dim" style="margin-top:6px;">total 0</div>
        <div class="dim">drwxr-xr-x   2 lucas  staff   64 May  7  2026 .</div>
        <div class="dim">drwxr-xr-x  14 lucas  staff  448 May  7  2026 ..</div>
        <div style="margin-top:10px;"><span class="cmt">{{ copy.comment }}</span></div>
        <div style="margin-top:6px;"><span class="pmpt">$</span> <span class="blink" /></div>
      </div>
    </div>
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
            label: '~ /codertheory/projects',
            arg: './projects',
            comment: "# nothing shipped yet — that's fine.",
            headline: 'An empty directory is honest.',
            body: "I'd rather show you nothing than ship filler. The next thing is in progress — usually closer than it looks.",
            primary: { to: '/blog', label: 'Read recent posts' },
            secondary: { to: '/about', label: "What I'm doing now" }
        },
        blog: {
            label: '~ /codertheory/blog',
            arg: './posts',
            comment: '# no posts yet — drafts in ~/notebooks.',
            headline: 'An empty page is also a page.',
            body: "I write less and re-read more than I'd like to admit. New posts arrive when they're actually worth your time.",
            primary: { to: '/projects', label: 'Browse projects' },
            secondary: { to: '/about', label: "What I'm doing now" }
        }
    } as const

    const copy = computed(() => COPY[props.kind])
</script>
