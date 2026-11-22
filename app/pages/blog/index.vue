<template>
  <div class="page">
    <section class="wrap page-head">
      <span class="eyebrow">Writing</span>
      <h1 class="h-section">
        Notes from the workbench, on teaching, shipping, and the why behind the keystrokes.
      </h1>
    </section>

    <section class="wrap section">
      <div v-if="(posts || []).length > 0" class="proj-filters">
        <button
          v-for="f in categories"
          :key="f"
          :class="['proj-filter', { 'is-active': filter === f }]"
          :aria-pressed="filter === f"
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
      <!-- Same row language as projects. A thumbnail appears only when a post
           has a real image; nothing stands in for one that is missing. -->
      <ul v-else class="prow-list">
        <li v-for="post in filteredPosts" :key="post.path">
          <article :class="['prow', 'prow--post', { 'prow--post-img': hasImage(post.image) }]">
            <div class="prow-body">
              <div class="prow-head">
                <h2 class="prow-title">
                  <NuxtLink class="prow-link" :to="`/blog/${slugFromPath(post.path)}`">{{ post.title }}</NuxtLink>
                </h2>
                <span class="prow-status">{{ formatDate(post.date) }}</span>
              </div>
              <p class="prow-tag">{{ post.excerpt }}</p>
              <p class="prow-meta">{{ post.cat }} · {{ readingTime(post) }} min read</p>
            </div>
            <NuxtImg
              v-if="hasImage(post.image)"
              class="post-row-img"
              :src="post.image!"
              alt=""
              width="200"
              height="125"
              sizes="200px"
            />
            <span class="prow-arrow" aria-hidden="true"><ArrowRight :size="18" /></span>
          </article>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
    const slugFromPath = (path: string | undefined) => (path || '').split('/').filter(Boolean).pop() || ''

    const formatDate = (s: string) => {
        const d = new Date(s)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
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

    // Older posts carried a keyword here ("stack") that drew a gradient in place
    // of a picture. Only an actual image path counts now.
    const hasImage = (image: string | null | undefined) => !!image && /^(\/|https?:)/.test(image)

    useSiteSeo({
        title: 'Blog',
        description: 'Notes from the workbench, on teaching, shipping, and the why behind the keystrokes.'
    })
</script>
