<template>
  <div class="page">
    <!-- Hero -->
    <section class="hero">
      <div class="wrap">
        <div class="hero-grid">
          <div>
            <span class="hero-codeline">
              <span class="caret">$</span>
              <span>cd ~/codertheory </span>
              <span class="blink" />
            </span>
            <h1 class="hero-title">
              Think first.<br>
              <span class="accented">Type</span> second.
            </h1>
            <p class="hero-sub">
              I build small software, mentor newer engineers, and write about the why behind the code — not just the keystrokes. This is where it all lives.
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

          <div class="hero-art">
            <div class="bulb-stage">
              <BrandLogo size="100%" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Now strip -->
    <section v-if="now" class="wrap" style="margin-top: 24px;">
      <a v-if="now.href" :href="now.href" class="now-strip fade-up">
        <span class="pulse" aria-hidden="true" />
        <div>
          <div class="label">// now</div>
          <div class="what">
            <em>{{ now.focus }}</em> — {{ now.what }}
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
            <em>{{ now.focus }}</em> — {{ now.what }}
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

    <!-- Mixed feed -->
    <section class="section wrap">
      <div class="section-head">
        <div class="lead">
          <span class="eyebrow">Latest from the workshop</span>
          <h2 class="h-section" style="margin-top: 14px;">
            What I've been <span class="scribble">making<ScribbleUnder /></span><br>
            and thinking about.
          </h2>
        </div>
        <NuxtLink class="arrow-link" to="/projects">
          Everything in chronological order <ArrowRight :size="14" />
        </NuxtLink>
      </div>

      <HomeFeedEmpty v-if="feedItems.length === 0" />
      <div v-else class="feed">
        <NuxtLink
          v-for="item in feedItems"
          :key="item.href"
          :to="item.href"
          class="card feed-item fade-up"
        >
          <div class="meta">
            <span :class="['kind', `kind--${item.kind}`]">
              {{ item.kind === 'project' ? 'Project' : 'Post' }}
            </span>
            <span>{{ item.meta }}</span>
          </div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.sub }}</p>
          <div class="meta-bottom">
            <span class="arrow-link">Read more <ArrowRight :size="14" /></span>
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- Quote -->
    <section class="wrap section" style="padding-top: 0;">
      <div class="quote-block fade-up">
        <span class="marks">“</span>
        <div class="q">
          The best engineers I know don't write more code — they understand the <em>shape</em> of the problem first, then write very little code.
        </div>
        <div class="who">— a thing I tell every mentee, eventually</div>
      </div>
    </section>

    <!-- Github card -->
    <section class="wrap section" style="padding-top: 0;">
      <div class="card github-card fade-up">
        <div>
          <div class="title">Six months of contributions</div>
          <p class="sub">Mostly mine, across indie work, the day job, and the occasional OSS drop-in.</p>
          <div class="stats">
            <div class="stat"><div class="n">{{ contributions }}</div><div class="l">contributions</div></div>
            <div class="stat"><div class="n">{{ reposTouched }}</div><div class="l">repos touched</div></div>
            <div class="stat"><div class="n">{{ pullRequests }}</div><div class="l">PRs opened</div></div>
          </div>
        </div>
        <div class="heatmap">
          <span
            v-for="(c, i) in heatmapCells"
            :key="i"
            class="cell-wrap"
            :data-tip="tipFor(c) || undefined"
          >
            <span :class="['cell', c.level > 0 ? `l${c.level}` : '']" />
          </span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
    import githubFixture from '~/data/github.json'

    type HeatmapCell = { date: string | null, count: number, level: number }
    type GithubStats = {
        contributions?: number
        commits: number
        pullRequests: number
        reposTouched: number
        heatmap: Array<HeatmapCell | number>
    }
    type StatsEnvelope<T> = { key: string, generatedAt: string, data: T, stale?: boolean }

    type FeedItem = {
        kind: 'project' | 'post'
        title: string
        sub: string
        meta: string
        date: string
        href: string
    }

    const formatDate = (s: string) => {
        const d = new Date(s)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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

    const feedItems = computed<FeedItem[]>(() => {
        const projectItems: FeedItem[] = (projects.value || []).map(p => ({
            kind: 'project',
            title: p.title,
            sub: p.tag,
            meta: `${(p.platforms || []).join(' · ')} · ${p.statusLabel || ''}`,
            date: p.date,
            href: `/projects/${slugFromPath(p.path)}`
        }))
        const postItems: FeedItem[] = (posts.value || []).map(p => ({
            kind: 'post',
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

    const fixture = githubFixture as unknown as GithubStats
    const { data: github } = await useFetch<StatsEnvelope<GithubStats>>('/api/stats/github', {
        key: 'stats-github',
        default: () => ({ key: 'github', generatedAt: new Date(0).toISOString(), data: fixture })
    })

    const stats = computed<GithubStats>(() => github.value?.data ?? fixture)
    const contributions = computed(() => stats.value.contributions ?? stats.value.commits)
    const pullRequests = computed(() => stats.value.pullRequests)
    const reposTouched = computed(() => stats.value.reposTouched)

    const tipDate = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    const heatmapCells = computed<HeatmapCell[]>(() =>
        (stats.value.heatmap as Array<number | HeatmapCell>).map(c =>
            typeof c === 'number' ? { date: null, count: 0, level: c } : c
        )
    )
    const tipFor = (c: HeatmapCell) => {
        if (!c.date) return null
        const when = tipDate.format(new Date(`${c.date}T00:00:00Z`))
        const what = c.count === 0 ? 'No contributions' : `${c.count} contribution${c.count === 1 ? '' : 's'}`
        return `${what} on ${when}`
    }

    useScrollReveal()
</script>
