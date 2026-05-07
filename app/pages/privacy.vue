<template>
  <div class="page">
    <section class="wrap doc-hero">
      <span class="eyebrow">Legal</span>
      <h1>Privacy policy</h1>
      <span class="when">last updated · April 30, 2026</span>
    </section>

    <section class="wrap section" style="padding-top: 0;">
      <div class="doc-grid">
        <aside class="doc-toc">
          <h6>On this page</h6>
          <a
            v-for="s in sections"
            :key="s.id"
            :href="`#${s.id}`"
            :class="{ active: activeId === s.id }"
            @click="activeId = s.id"
          >
            {{ s.h }}
          </a>
        </aside>

        <div class="prose">
          <p class="lede">
            Short version: I don't track you, I don't sell anything about you, and the apps I make do as little with your data as they can get away with.
          </p>
          <div v-for="s in sections" :id="s.id" :key="s.id">
            <h2>{{ s.h }}</h2>
            <p>{{ s.body }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
    const sections = [
        {
            id: 'what',
            h: 'What I collect',
            body: "As little as possible. This site uses no analytics, no third-party trackers, and no cookies beyond what's strictly required to remember your theme preference. The contact form sends your message to my inbox — that's it."
        },
        {
            id: 'apps',
            h: 'About my apps',
            body: 'Each app I publish has its own data story, and I try to keep them all simple: data lives on your device or in your iCloud account. Nothing flows back to me unless you opt in to crash reports or you reach out to me directly.'
        },
        {
            id: 'kids',
            h: 'Kids',
            body: "None of my apps are designed for children under 13. If you believe a child has provided personal information through one of my apps, contact me and I'll remove it."
        },
        {
            id: 'rights',
            h: 'Your rights',
            body: 'You can ask me what I have on you (almost certainly nothing), ask me to delete it, or ask any other question about how your data is handled. I will answer.'
        },
        {
            id: 'changes',
            h: 'Changes',
            body: 'If this policy changes, the updated date at the top will move. Material changes will also be mentioned in a blog post.'
        }
    ]

    const activeId = ref(sections[0]?.id || '')

    useScrollReveal()
</script>
