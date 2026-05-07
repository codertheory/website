<template>
  <div class="page">
    <section class="wrap" style="padding-top: 60px;">
      <span class="eyebrow">Writing</span>
      <h1 class="h-section" style="margin-top: 14px; max-width: 800px;">
        Notes from the workbench — on <span class="scribble">teaching<ScribbleUnder /></span>, shipping, and the why behind the keystrokes.
      </h1>
    </section>

    <section class="wrap section">
      <div class="blog-grid">
        <NuxtLink
          v-for="post in (posts || [])"
          :key="post.path"
          :to="`/blog/${slugFromPath(post.path)}`"
          :class="['card', 'post-card', 'fade-up', { typographic: !post.image }]"
        >
          <div :class="['post-thumb', { 'no-img': !post.image }]">
            <template v-if="post.image">
              <div :class="['image-fill', post.image === 'stack' ? 'image-stack' : 'image-other']">
                <span class="image-headword">{{ firstWord(post.title) }}</span>
              </div>
            </template>
            <template v-else-if="post.quote">
              <div class="quoteish">
                “<template v-for="(seg, i) in quoteSegments(post.quote)" :key="i">
                  <em v-if="seg.em">{{ seg.text }}</em>
                  <template v-else>{{ seg.text }}</template>
                </template>”
              </div>
            </template>
            <template v-else>
              <span class="glyph">¶</span>
            </template>
          </div>
          <span class="post-cat">{{ post.cat }}</span>
          <h3>{{ post.title }}</h3>
          <p class="excerpt">{{ post.excerpt }}</p>
          <div class="post-foot">
            <span>{{ formatDate(post.date) }}</span>
            <span>3 min read</span>
          </div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
    const slugFromPath = (path: string | undefined) => (path || '').split('/').filter(Boolean).pop() || ''

    const formatDate = (s: string) => {
        const d = new Date(s)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const { data: posts } = await useAsyncData('blog-index', () =>
        queryCollection('news').order('date', 'DESC').all()
    )

    const quoteSegments = (quote: string | undefined) => {
        if (!quote) return []
        return quote.split('*').map((text, i) => ({ text, em: i % 2 === 1 }))
    }

    const firstWord = (title: string) => title.split(' ')[0] || ''

    useScrollReveal()
</script>
