<template>
  <div v-if="doc" class="page">
    <section class="wrap-narrow" style="padding-top: 60px;">
      <span class="eyebrow">Uses</span>
      <h1 class="h-section" style="margin-top: 14px;">
        The tools I <span class="scribble">actually reach for<ScribbleUnder /></span>.
      </h1>
      <p class="uses-lede">{{ doc.lede }}</p>
      <p class="uses-meta">updated {{ formatDate(doc.updatedAt) }}</p>
    </section>

    <article class="prose uses-body">
      <ContentRenderer :value="doc" />
    </article>
  </div>
</template>

<script setup lang="ts">
    const { data: doc } = await useAsyncData('uses-page', () => queryCollection('uses').first())

    if (!doc.value) {
        throw createError({statusCode: 404, statusMessage: 'Uses page not found', fatal: true})
    }

    const formatDate = (s: string | undefined) => {
        if (!s) return ''
        const d = new Date(s)
        return Number.isNaN(d.getTime())
            ? s
            : d.toLocaleDateString('en-US', {month: 'long', year: 'numeric', timeZone: 'UTC'})
    }

    useSiteSeo({
        title: 'Uses',
        description: 'The editors, languages, infrastructure and small tools Lucas actually reaches for.'
    })

    useScrollReveal()
</script>
