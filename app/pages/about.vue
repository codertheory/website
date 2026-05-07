<template>
  <div class="page">
    <section class="wrap about-hero">
      <span class="eyebrow">About</span>
      <h1 class="h-section" style="margin-top: 14px; max-width: 800px;">
        Hi, I'm <span class="scribble">Lucas<ScribbleUnder /></span> — a programmer who'd rather teach you the why.
      </h1>
    </section>

    <section class="wrap section" style="padding-top: 40px;">
      <div class="about-grid">
        <div class="about-portrait fade-up">
          <span class="label">portrait.jpg</span>
        </div>

        <div>
          <div class="about-bio fade-up">
            <p v-for="(line, i) in bio" :key="i">
              <template v-for="(seg, j) in bioSegments(line)" :key="j">
                <em v-if="seg.em">{{ seg.text }}</em>
                <template v-else>{{ seg.text }}</template>
              </template>
            </p>
          </div>

          <h3 class="about-meta">The path so far</h3>
          <p class="about-meta-sub">// roughly chronological</p>
          <ul class="timeline">
            <li v-for="(t, i) in timeline" :key="i" class="fade-up">
              <div class="when">{{ t.when }}</div>
              <div class="what">{{ t.what }}</div>
              <div class="where">{{ t.where }}</div>
            </li>
          </ul>

          <h3 class="about-meta">What I work in</h3>
          <p class="about-meta-sub">// not a checklist, just honest</p>
          <div class="skills">
            <span v-for="s in skills" :key="s" class="chip">{{ s }}</span>
          </div>

          <div style="margin-top: 36px;">
            <NuxtLink class="btn btn--primary" to="/contact">
              Say hello <ArrowRight />
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
    const bio = [
        "I'm Lucas — a full-stack developer who'd rather teach you the *why* than hand you the answer.",
        "Seven-plus years architecting web apps end-to-end: Python (Django, FastAPI) and modern JS (React, Vue, Nuxt) on top, AWS infrastructure underneath. Lately I've been deep in Kotlin Multiplatform and Swift, shipping a cross-platform e-reader to iOS and Android.",
        'Codertheory is where I keep the things I make and the things I think out loud about. Take what\'s useful.'
    ]

    const timeline = [
        { when: '2025 — 2026', what: 'Full-stack at TripNinja', where: 'Built an auth micro-service and AWS API Gateway proxy routing 10k+ daily requests to the Django core. Untangled Celery and ECS auto-scaling under peak load.' },
        { when: '2023 — 2025', what: 'Full-stack at ChartD', where: 'Founding-team engineer on a FastAPI + MongoDB SDLC SaaS. Built the MLOps pipeline onto SageMaker and owned all AWS infrastructure as one of two engineers.' },
        { when: '2021 — 2023', what: 'Full-stack at FarmLink', where: 'Vue + Django "Price Map" for North American grain farmers, async price alerting over geographic data, and mentoring co-ops on TDD.' },
        { when: '2019 — 2021', what: 'Founding engineer at LoKnow', where: 'Built a Scrapyd-powered ad-automation SaaS from zero, taught myself AWS (ECS/ECR/RDS) along the way, and shipped a Django + Vue RBAC system with a 5-person team.' }
    ]

    const skills = ['TypeScript', 'Python', 'Swift', 'Kotlin', 'Dart', 'Django', 'FastAPI', 'Vue / Nuxt', 'React', 'Compose Multiplatform', 'Flutter', 'MongoDB', 'MySQL', 'AWS (ECS / RDS / SageMaker)', 'Docker', 'GitHub Actions']

    const bioSegments = (line: string) => line.split('*').map((text, i) => ({ text, em: i % 2 === 1 }))

    useScrollReveal()
</script>
