<template>
  <div class="page">
    <section class="wrap doc-hero">
      <span class="eyebrow">Legal</span>
      <h1>Terms of use</h1>
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
            Short version: be a good neighbour. The site and apps are mine to maintain, free for you to use within reason, and offered with no warranties.
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
            id: 'use',
            h: 'Using this site',
            body: "Read, share, link, quote — please do. The writing here is mine; if you want to republish a full post, ask first and credit me. Code samples are MIT-style fair game unless a post explicitly says otherwise."
        },
        {
            id: 'apps',
            h: 'Using my apps',
            body: 'Each app has its own license, listed on the App Store page or in the repo. Most are paid one-time with no subscriptions; a few are open source. Don\'t reverse-engineer the paid ones to bypass payment — that\'s not very nice.'
        },
        {
            id: 'warranty',
            h: 'No warranty',
            body: 'The site, the apps, and the writing are provided as-is. I take care, but I can\'t guarantee anything is bug-free, available, or fit for any specific purpose. Use at your own risk.'
        },
        {
            id: 'liability',
            h: 'Liability',
            body: 'To the extent permitted by law, I\'m not liable for damages arising from your use of anything I publish here. If something I made causes you a problem, tell me — I\'ll usually try to help.'
        },
        {
            id: 'changes',
            h: 'Changes',
            body: 'These terms can change. Material changes will be flagged at the top of this page and in a blog post.'
        }
    ]

    const activeId = ref(sections[0]?.id || '')

    useScrollReveal()
</script>
