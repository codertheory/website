<template>
  <div class="page">
    <section class="wrap" style="padding-top: 60px;">
      <span class="eyebrow">Writing</span>
      <h1 class="h-section" style="margin-top: 14px; max-width: 800px;">
        Notes from the workbench, on <span class="scribble">teaching<ScribbleUnder /></span>, shipping, and the why behind the keystrokes.
      </h1>
    </section>

    <section class="wrap section">
      <div v-if="(posts || []).length > 0" class="proj-filters">
        <button
          v-for="f in categories"
          :key="f"
          :class="['proj-filter', { 'is-active': filter === f }]"
          @click="filter = f"
        >
          {{ f }}
        </button>
        <span class="proj-filter-spacer" />
        <span class="proj-filter-count">
          {{ filteredPosts.length }} {{ filteredPosts.length === 1 ? 'post' : 'posts' }}
        </span>
      </div>

      <EmptyDirectory v-if="(posts || []).length === 0" kind="blog" />
      <EmptyFilter
        v-else-if="filteredPosts.length === 0"
        v-model:filter="filter"
        :filters="categories"
        kind="blog"
      />
      <div v-else class="blog-grid">
        <NuxtLink
          v-for="post in filteredPosts"
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
            <span>{{ readingTime(post) }} min read</span>
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

    const categories = computed<string[]>(() => {
        const set = new Set<string>(['All'])
        for (const p of posts.value || []) set.add(p.cat)
        return Array.from(set)
    })

    const filter = ref<string>('All')

    const filteredPosts = computed(() => {
        const items = posts.value || []
        if (filter.value === 'All') return items
        return items.filter(p => p.cat === filter.value)
    })

    const quoteSegments = (quote: string | undefined) => {
        if (!quote) return []
        return quote.split('*').map((text, i) => ({ text, em: i % 2 === 1 }))
    }

    const firstWord = (title: string) => title.split(' ')[0] || ''

    useSiteSeo({
        title: 'Blog',
        description: 'Notes from the workbench, on teaching, shipping, and the why behind the keystrokes.'
    })

    useScrollReveal(filter)
</script>
