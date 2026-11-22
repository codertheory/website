<template>
  <NuxtLayout>
    <div class="page wrap notfound">
      <TerminalPanel label="~ /codertheory" :lines="lines" />
      <div class="crumb-eyebrow">{{ error.statusCode || 404 }} / not found</div>
      <h1 class="h-section">
        That page isn't here, so let's go back.
      </h1>
      <div class="cta">
        <a class="btn btn--primary" href="/" @click.prevent="handleError">
          Take me home <ArrowRight />
        </a>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
    import type { NuxtError } from '#app'
    import type { TerminalLine } from '~/components/TerminalPanel.vue'

    const props = defineProps<{ error: NuxtError }>()

    const handleError = () => clearError({ redirect: '/' })

    // What the shell says when you cd somewhere that is not there. Other
    // errors (a 500) just show the path.
    const route = useRoute()
    const lines = computed<TerminalLine[]>(() => {
        const path = route.path || '/'
        return (props.error.statusCode || 404) === 404
            ? [{ kind: 'cmd', text: 'cd', arg: `.${path}` }, { kind: 'out', text: `cd: no such file or directory: .${path}` }]
            : [{ kind: 'cmd', text: 'cd', arg: `.${path}` }, { kind: 'out', text: `${props.error.statusCode} ${props.error.statusMessage || 'error'}` }]
    })

    useSiteSeo({
        title: `${props.error.statusCode || 404} page not found`,
        description: "That page isn't here. Head back home.",
        noindex: true
    })
</script>
