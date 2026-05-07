<template>
  <div v-if="project" class="page">
    <section class="wrap detail-hero">
      <div class="crumb">
        <NuxtLink to="/projects">Projects</NuxtLink>
        <span>/</span>
        <span>{{ project.title }}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
        <span class="spin-tag">
          <span :class="['dot', `dot--${project.status}`]" /> {{ project.statusLabel }}
        </span>
        <span class="chip">{{ project.type }}</span>
      </div>
      <h1 class="h-display" style="font-size: clamp(48px, 6vw, 80px);">{{ project.title }}</h1>
      <p style="font-size: 22px; color: var(--ink-soft); max-width: 700px; margin-top: 14px; font-family: var(--f-display); font-weight: 400; line-height: 1.4;">
        {{ project.tag }}
      </p>
    </section>

    <section class="wrap" style="padding-bottom: 60px;">
      <div class="detail-grid">
        <div>
          <div class="detail-mock">
            <div class="deviceish">
              <div class="notch" />
              <div class="device-icon">{{ project.icon }}</div>
            </div>
          </div>

          <h3 style="font-family: var(--f-display); font-size: 30px; margin-top: 40px; margin-bottom: 6px; font-weight: 600; letter-spacing: -0.015em;">
            What's inside
          </h3>
          <p style="color: var(--ink-soft); margin: 0;">The features I'd actually point a friend to.</p>
          <ul class="detail-features">
            <li v-for="(f, i) in (project.features || [])" :key="i" class="fade-up">
              <span class="num">{{ padNum(i + 1) }}</span>
              <div>
                <b>{{ f.t }}</b>
                <span>{{ f.d }}</span>
              </div>
            </li>
          </ul>
        </div>

        <aside class="card detail-side">
          <h5>At a glance</h5>
          <div class="row"><span class="k">platform</span><span class="v">{{ (project.platforms || []).join(', ') }}</span></div>
          <div class="row"><span class="k">type</span><span class="v">{{ project.type }}</span></div>
          <div class="row"><span class="k">started</span><span class="v">{{ project.started }}</span></div>
          <div class="row"><span class="k">status</span><span class="v">{{ project.statusLabel }}</span></div>

          <h5 style="margin-top: 24px;">Stack</h5>
          <div class="stack-chips">
            <span v-for="s in (project.stack || [])" :key="s" class="chip">{{ s }}</span>
          </div>

          <h5 style="margin-top: 24px;">Links</h5>
          <div class="detail-links">
            <a v-for="(l, i) in (project.links || [])" :key="i" :href="l.href">
              <span>{{ l.label }}</span>
              <ExternalIcon />
            </a>
          </div>
        </aside>
      </div>
    </section>

    <section class="wrap story-block">
      <span class="eyebrow">Why I built it</span>
      <div class="body" style="margin-top: 18px;">
        <p>
          <template v-for="(seg, i) in whySegments" :key="i">
            <em v-if="seg.em">{{ seg.text }}</em>
            <template v-else>{{ seg.text }}</template>
          </template>
        </p>
      </div>
    </section>

    <section class="wrap" style="padding-bottom: 80px;">
      <h3 style="font-family: var(--f-display); font-size: 30px; font-weight: 600; letter-spacing: -0.015em; margin: 0;">
        Screenshots
      </h3>
      <p style="color: var(--ink-soft); margin: 6px 0 0;">A few favourite views — drop in real shots when ready.</p>
      <div class="shots-strip">
        <div v-for="n in 3" :key="n" class="shot fade-up">
          <div class="stripe" />
          <span class="label">screenshot_0{{ n }}.png</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
    const route = useRoute()
    const path = computed(() => `/projects/${route.params.slug}`)

    const { data: project } = await useAsyncData(
        () => `project-${route.params.slug}`,
        () => queryCollection('projects').path(path.value).first(),
        { watch: [path] }
    )

    if (!project.value) {
        throw createError({ statusCode: 404, statusMessage: 'Project not found', fatal: true })
    }

    const whySegments = computed(() => {
        const why = project.value?.why || ''
        return why.split('*').map((text, i) => ({ text, em: i % 2 === 1 }))
    })

    const padNum = (n: number) => String(n).padStart(2, '0')

    useScrollReveal()
</script>
