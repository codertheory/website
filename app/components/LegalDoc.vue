<template>
  <div v-if="doc" class="page">
    <section class="wrap doc-hero">
      <span class="eyebrow">{{ doc.eyebrow }}</span>
      <h1>{{ doc.title }}</h1>
      <span class="when">last updated · {{ formattedUpdated }}</span>
    </section>

    <section class="wrap section" style="padding-top: 0;">
      <div class="doc-grid">
        <aside class="doc-toc">
          <h6>On this page</h6>
          <a
            v-for="link in tocLinks"
            :key="link.id"
            :href="`#${link.id}`"
            :class="{ active: activeId === link.id }"
            @click="activeId = link.id"
          >
            {{ link.text }}
          </a>
        </aside>

        <div class="prose">
          <p class="lede">{{ doc.lede }}</p>
          <ContentRenderer :value="doc" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
    const props = defineProps<{ slug: string }>()

    const { data: doc } = await useAsyncData(`legal-${props.slug}`, () =>
        queryCollection('legal').path(`/legal/${props.slug}`).first()
    )

    type TocLink = { id: string, text: string, depth?: number, children?: TocLink[] }
    const tocLinks = computed<TocLink[]>(() => {
        const raw = (doc.value as unknown as { body?: { toc?: { links?: TocLink[] } } })?.body?.toc?.links ?? []
        // Flatten to top-level H2s only — matches the original sidebar shape.
        return raw.flatMap(l => (l.depth === 2 ? [l] : (l.children || []).filter(c => c.depth === 2)))
    })

    const activeId = ref<string>('')
    watchEffect(() => {
        if (!activeId.value && tocLinks.value[0]) activeId.value = tocLinks.value[0].id
    })

    const formattedUpdated = computed(() => {
        const raw = doc.value?.updatedAt
        if (!raw) return ''
        const d = new Date(raw)
        if (Number.isNaN(d.getTime())) return raw
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
    })

    useSiteSeo(() => ({
        title: doc.value?.title,
        description: doc.value?.lede,
        modifiedTime: doc.value?.updatedAt,
        noindex: false
    }))

    useScrollReveal()
</script>
