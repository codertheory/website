<template>
  <div class="page">
    <!-- Hero -->
    <section class="hero">
      <div class="wrap">
        <div class="hero-grid">
          <div class="hero-copy">
            <!-- TODO(lucas): placeholder status label, replace with your own wording. -->
            <div class="hero-id">
              <span class="hero-name">Lucas</span>
              <NuxtLink class="hero-status" to="/contact?topic=role">
                <span class="dot dot--active" aria-hidden="true" />
                Open to roles
                <ArrowRight :size="13" />
              </NuxtLink>
              <a class="hero-github" href="https://github.com/codertheory/">GitHub <ExternalIcon :size="12" /></a>
            </div>
            <h1 class="hero-title">
              Think first. <br>
              <span class="accented">Type</span> second.
            </h1>
            <!-- TODO(lucas): lifted word for word from the About bio as a stand-in. Write the real line. -->
            <p class="hero-sub">
              I'm Lucas, a self-taught full-stack developer who'd rather teach you the <em>why</em> than hand you the answer. Over 7 years building web applications, mostly Python (Django, FastAPI) on the back and Vue/Nuxt or React on the front, with the AWS underneath it.
            </p>
            <div class="hero-ctas">
              <NuxtLink class="btn btn--primary" to="/projects">
                See what I've built <ArrowRight />
              </NuxtLink>
              <NuxtLink class="btn btn--ghost" to="/blog">
                Read recent posts
              </NuxtLink>
            </div>
          </div>

          <div v-if="featured.length" class="hero-work">
            <!-- The one project with a live URL and real screenshots, shown as itself and named. -->
            <figure v-if="showcase" class="showcase-shot">
              <NuxtImg
                :src="showcase.heroSrc"
                :alt="showcase.shot.alt || `${showcase.project.title} screenshot`"
                width="1440"
                height="900"
                sizes="100vw md:540px"
                loading="eager"
              />
              <figcaption>
                <NuxtLink class="showcase-name" :to="showcase.href">{{ showcase.project.title }}</NuxtLink>
                <span v-if="showcase.live" class="showcase-domain">{{ showcase.domain }}</span>
                <a v-if="showcase.live" class="prow-ext" :href="showcase.live.href">
                  {{ showcase.live.label }} <ExternalIcon :size="12" />
                </a>
              </figcaption>
            </figure>
            <ul class="prow-list" aria-label="Featured projects">
              <li v-for="p in featured" :key="p.path">
                <ProjectRow :project="p" compact />
              </li>
            </ul>
            <!-- TODO(lucas): placeholder link label. -->
            <NuxtLink class="arrow-link featured-all" to="/projects">
              All {{ (projects || []).length }} projects <ArrowRight :size="14" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Now strip -->
    <section v-if="now && nowIsFresh" class="wrap now-wrap">
      <a v-if="now.href" :href="now.href" class="now-strip fade-up">
        <span class="pulse" aria-hidden="true" />
        <div>
          <div class="label">// now</div>
          <div class="what">
            <em>{{ now.focus }}</em> {{ now.what }}
          </div>
        </div>
        <ClientOnly>
          <span class="ago">updated {{ relativeTime(now.updatedAt) }}</span>
          <template #fallback>
            <span class="ago">updated {{ now.updatedAt }}</span>
          </template>
        </ClientOnly>
      </a>
      <div v-else class="now-strip fade-up">
        <span class="pulse" aria-hidden="true" />
        <div>
          <div class="label">// now</div>
          <div class="what">
            <em>{{ now.focus }}</em> {{ now.what }}
          </div>
        </div>
        <ClientOnly>
          <span class="ago">updated {{ relativeTime(now.updatedAt) }}</span>
          <template #fallback>
            <span class="ago">updated {{ now.updatedAt }}</span>
          </template>
        </ClientOnly>
      </div>
    </section>

    <!-- Dates and roles only; the About page has the detail. Words are from there. -->
    <section class="wrap path">
      <div>
        <h2 class="path-h">The path so far</h2>
        <NuxtLink class="arrow-link" to="/about">
          About <ArrowRight :size="14" />
        </NuxtLink>
      </div>
      <ol class="path-list">
        <li v-for="t in timeline" :key="t.when">
          <span class="when">{{ t.when }}</span>
          <span class="what">{{ t.what }}</span>
        </li>
      </ol>
    </section>

    <section class="section wrap more">
      <h2 class="h-section">
        What I've been <span class="scribble">making<ScribbleUnder /></span><br>
        and thinking about.
      </h2>

      <HomeFeedEmpty v-if="feedItems.length === 0" />
      <ul v-else class="prow-list">
        <li v-for="item in feedItems" :key="item.href">
          <ProjectRow v-if="item.project" :project="item.project" heading="h3">
            <!-- A peek at the real diagram; the full one is on the project page. -->
            <template v-if="item.href === '/projects/job-pipeline'" #figure>
              <PipelineFlow preview />
            </template>
          </ProjectRow>
          <article v-else class="prow prow--post">
            <div class="prow-body">
              <div class="prow-head">
                <h3 class="prow-title">
                  <NuxtLink class="prow-link" :to="item.href">{{ item.title }}</NuxtLink>
                </h3>
                <span class="prow-status">{{ item.meta }}</span>
              </div>
              <p class="prow-tag">{{ item.sub }}</p>
            </div>
            <span class="prow-arrow" aria-hidden="true"><ArrowRight :size="18" /></span>
          </article>
        </li>
      </ul>
    </section>

    <section class="wrap closing">
      <!-- TODO(lucas): borrowed from the contact page heading as a stand-in. -->
      <p class="closing-line">Send me a note. I read everything.</p>
      <NuxtLink class="btn btn--primary" to="/contact">
        Get in touch <ArrowRight />
      </NuxtLink>
    </section>
  </div>
</template>

<script setup lang="ts">
    import { timeline } from '~/data/timeline'

    const formatDate = (s: string) => {
        const d = new Date(s)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    }

    const slugFromPath = (path: string | undefined) => (path || '').split('/').filter(Boolean).pop() || ''

    const { data: projects } = await useAsyncData('home-projects', () =>
        queryCollection('projects').order('date', 'DESC').all()
    )
    const { data: posts } = await useAsyncData('home-posts', () =>
        queryCollection('news').order('date', 'DESC').all()
    )
    const { data: now } = await useAsyncData('home-now', () =>
        queryCollection('now').first()
    )

    // Shown beside the hero, in this order. They are left out of the feed below
    // so the same three projects are not listed twice on one page.
    const FEATURED = ['mangasteen', 'shiritori', 'cresthold']
    const featured = computed(() =>
        FEATURED
            .map(slug => (projects.value || []).find(p => slugFromPath(p.path) === slug))
            .filter((p): p is NonNullable<typeof p> => !!p)
    )

    // The project shown large under the hero. Only one has both a live URL and
    // real screenshots, and nothing stands in for a screenshot that is missing.
    const SHOWCASE = 'shiritori'
    const showcase = computed(() => {
        const project = (projects.value || []).find(p => slugFromPath(p.path) === SHOWCASE)
        const shot = project?.screenshots?.[0]
        if (!project || !shot) return null
        const live = (project.links || []).find(l => l.kind === 'site') || null
        return {
            project,
            shot,
            // The same capture with its empty left margin and footer trimmed, so the
            // interface reads a little larger at hero size.
            heroSrc: '/shots/shiritori-lobby-hero.webp',
            live,
            domain: live ? live.href.replace(/^https?:\/\//, '').replace(/\/$/, '') : '',
            href: `/projects/${SHOWCASE}`
        }
    })

    // A "now" that is months old says the opposite of what it is for, so the
    // strip steps aside until content/now.md is updated.
    const NOW_MAX_AGE_DAYS = 60
    const nowIsFresh = computed(() => {
        const then = new Date(now.value?.updatedAt || '').getTime()
        return !Number.isNaN(then) && Date.now() - then < NOW_MAX_AGE_DAYS * 86_400_000
    })

    const relativeTime = (iso: string | undefined | null) => {
        if (!iso) return ''
        const then = new Date(iso).getTime()
        if (Number.isNaN(then)) return ''
        const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000))
        const day = 86_400
        if (diffSec < 60) return 'just now'
        if (diffSec < 3_600) return `${Math.round(diffSec / 60)}m ago`
        if (diffSec < day) return `${Math.round(diffSec / 3_600)}h ago`
        if (diffSec < 30 * day) return `${Math.round(diffSec / day)}d ago`
        if (diffSec < 365 * day) return `${Math.round(diffSec / (30 * day))}mo ago`
        return `${Math.round(diffSec / (365 * day))}y ago`
    }

    // Everything not already beside the hero, newest first: the remaining
    // projects, plus posts once there are any.
    const feedItems = computed(() => {
        const projectItems = (projects.value || [])
            .filter(p => !FEATURED.includes(slugFromPath(p.path)))
            .map(p => ({
                project: p,
                title: p.title,
                sub: p.tag,
                meta: '',
                date: p.date,
                href: `/projects/${slugFromPath(p.path)}`
            }))
        const postItems = (posts.value || []).map(p => ({
            project: null,
            title: p.title,
            sub: p.excerpt,
            meta: `${p.cat} · ${formatDate(p.date)}`,
            date: p.date,
            href: `/blog/${slugFromPath(p.path)}`
        }))
        return [...projectItems, ...postItems]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 6)
    })

    useSiteSeo({
        description: "Lucas builds small software, mentors newer engineers, and writes about the why behind the code. Projects, posts, and the workshop in one place."
    })

    useScrollReveal()
</script>
