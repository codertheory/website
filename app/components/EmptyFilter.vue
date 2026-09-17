<template>
  <div class="es-v5 fade-up">
    <div class="pill">
      <button class="x" aria-label="Clear filter" @click="clear">×</button>
      <span>{{ copy.pillLabel }}: <b style="color: var(--ink);">{{ filter }}</b></span>
    </div>
    <h2>{{ copy.headlinePrefix }} <em>{{ filter }}</em> {{ copy.headlineSuffix }}</h2>
    <p class="body">{{ body }}</p>
    <div class="es-ctas">
      <button class="btn btn--primary" @click="clear">← Show everything</button>
      <NuxtLink class="btn btn--ghost" to="/contact">{{ copy.secondary }}</NuxtLink>
    </div>
    <div v-if="alts.length > 0" class="alt-tags">
      <span>Try instead:</span>
      <button
        v-for="t in alts"
        :key="t"
        class="alt"
        @click="emit('update:filter', t)"
      >
        {{ t }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
    const props = defineProps<{
        filter: string
        filters: readonly string[]
        kind: 'projects' | 'blog'
    }>()

    const emit = defineEmits<{ 'update:filter': [value: string] }>()

    const COPY = {
        projects: {
            pillLabel: 'filter',
            headlinePrefix: 'Nothing tagged',
            headlineSuffix: 'yet.',
            body: "It's a thin shelf for now. Try a neighbouring category, or come back when I've finished the thing on the workbench.",
            secondary: 'Tell me what to build next'
        },
        blog: {
            pillLabel: 'category',
            headlinePrefix: 'Nothing under',
            headlineSuffix: 'yet.',
            body: 'I write across topics in batches. The next "{filter}" piece is usually a couple of posts away.',
            secondary: 'Tell me what to write next'
        }
    } as const

    const copy = computed(() => COPY[props.kind])
    const body = computed(() => copy.value.body.replace('{filter}', props.filter))

    const alts = computed(() =>
        props.filters.filter(f => f !== 'All' && f !== props.filter).slice(0, 3)
    )

    const clear = () => emit('update:filter', 'All')
</script>
