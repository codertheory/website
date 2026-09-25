<template>
  <div class="page">
    <section class="wrap-narrow" style="padding-top: 60px;">
      <span class="eyebrow">Now</span>
      <h1 class="h-section" style="margin-top: 14px;">
        What I'm <span class="scribble">working on<ScribbleUnder /></span> at the moment.
      </h1>
      <p class="now-lede">
        A <a href="https://nownownow.com/about" target="_blank" rel="noopener">now page</a>:
        not a changelog, not a CV. Just whatever has my attention right now.
      </p>
    </section>

    <section v-if="now" class="wrap-narrow" style="margin-top: 32px;">
      <div class="now-strip">
        <span class="pulse" />
        <div>
          <div class="label">// now</div>
          <div class="what">
            <em>{{ now.focus }}</em> {{ now.what }}
          </div>
        </div>
        <span class="ago">updated {{ formatDate(now.updatedAt) }}</span>
      </div>

      <article v-if="hasDetail" class="prose now-detail">
        <ContentRenderer :value="now" />
      </article>
      <p v-else class="now-empty">
        Nothing more to report yet. The short version above is the whole story this month.
      </p>
    </section>

    <section class="wrap-narrow now-foot">
      <p>
        Older work lives in <NuxtLink to="/projects">projects</NuxtLink>, and the
        thinking behind it in <NuxtLink to="/blog">writing</NuxtLink>.
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
    const { data: now } = await useAsyncData('now-page', () => queryCollection('now').first())

    const formatDate = (s: string | undefined) => {
        if (!s) return ''
        const d = new Date(s)
        return Number.isNaN(d.getTime())
            ? s
            : d.toLocaleDateString('en-US', {month: 'long', year: 'numeric', timeZone: 'UTC'})
    }

    // Content-based for the same reason as the project writeup: a body can be
    // present and still render to nothing, and the fallback line below is a
    // better answer than an empty space.
    const hasDetail = computed(() => countWords(now.value) > 0)

    useSiteSeo({
        title: 'Now',
        description: "What Lucas is working on at the moment, the current focus and what's on the workbench."
    })

    useScrollReveal()
</script>
