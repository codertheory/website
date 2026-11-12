<template>
  <div v-if="doc" class="page">
    <section class="wrap about-hero">
      <span class="eyebrow">{{ doc.eyebrow }}</span>
      <h1 class="h-section" style="margin-top: 14px; max-width: 800px;">
        {{ doc.headlineBefore }}<span class="scribble">{{ doc.headlineName }}<ScribbleUnder /></span>{{ doc.headlineAfter }}
      </h1>
    </section>

    <section class="wrap section" style="padding-top: 40px;">
      <div class="about-grid">
        <div class="about-portrait fade-up">
          <NuxtImg
            :src="doc.portrait.src"
            :alt="doc.portrait.alt"
            width="800"
            height="800"
            sizes="280px"
            loading="eager"
          />
        </div>

        <div>
          <div class="about-bio fade-up">
            <ContentRenderer :value="doc" />
          </div>

          <h2 class="about-meta">{{ doc.timelineHeading }}</h2>
          <p class="about-meta-sub">{{ doc.timelineSub }}</p>
          <ul class="timeline">
            <li v-for="(t, i) in timeline" :key="i" class="fade-up">
              <div class="when">{{ t.when }}</div>
              <div class="what">{{ t.what }}</div>
              <div class="where">{{ t.where }}</div>
            </li>
          </ul>

          <h2 class="about-meta">{{ doc.skillsHeading }}</h2>
          <p class="about-meta-sub">{{ doc.skillsSub }}</p>
          <div class="skills">
            <span v-for="s in doc.skills" :key="s" class="chip"><TechIcon :name="s" />{{ s }}</span>
          </div>

          <div style="margin-top: 36px;">
            <NuxtLink class="btn btn--primary" to="/contact">
              {{ doc.ctaLabel }} <ArrowRight />
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
    import { timeline } from '~/data/timeline'

    const { data: doc } = await useAsyncData('about-page', () => queryCollection('about').first())

    if (!doc.value) {
        throw createError({statusCode: 404, statusMessage: 'About page not found', fatal: true})
    }

    useSiteSeo({
        title: doc.value.title,
        description: doc.value.description,
        type: 'profile'
    })

    useScrollReveal()
</script>
