<template>
  <div class="page">
    <section class="wrap about-hero">
      <span class="eyebrow">About</span>
      <h1 class="h-section" style="margin-top: 14px; max-width: 800px;">
        Hi, I'm <span class="scribble">Lucas<ScribbleUnder /></span>, a programmer who'd rather teach you the why.
      </h1>
    </section>

    <section class="wrap section" style="padding-top: 40px;">
      <div class="about-grid">
        <div class="about-portrait fade-up">
          <NuxtImg
            src="/portrait.jpg"
            alt="Lucas Lukowski"
            width="800"
            height="800"
            sizes="280px"
            loading="eager"
          />
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
        "I'm Lucas, a self-taught full-stack developer who'd rather teach you the *why* than hand you the answer.",
        "Over 7 years building web applications, mostly Python (Django, FastAPI) on the back and Vue/Nuxt or React on the front, with the AWS underneath it. Lately I have been deep in Kotlin Multiplatform and Swift, shipping a manga reader to iOS and Android.",
        'Codertheory is where I keep the things I make and the things I think out loud about. Take whatever is useful.'
    ]

    const timeline = [
        { when: '2025-2026', what: 'Full-stack at TripNinja', where: 'Built an auth microservice, then scaffolded and spun up the API Gateway our API sits behind, routing 10k+ daily requests to the Django core. Also untangled Celery and ECS auto-scaling under peak load.' },
        { when: '2023-2025', what: 'Full-stack at ChartD', where: 'Founding engineer. Built an AI chat app that plugged into companies\' own data, learned to train/deploy models on SageMaker, then we pivoted into an SDLC product. Owned all the AWS as one of two engineers.' },
        { when: '2021-2023', what: 'Full-stack at FarmLink', where: 'Vue + Django Price Map for North American grain farmers to find/locate bins and see prices, with filters that email you when a price goes below/above what you set. Also mentored co-ops on TDD.' },
        { when: '2019-2021', what: 'Founding engineer at LoKnow', where: 'Built an ad-automation SaaS from zero with Scrapyd scrapers, taught myself AWS along the way (ECS/ECR/RDS), and shipped a Django + Vue RBAC system with a 5-person team.' }
    ]

    const skills = ['TypeScript', 'Python', 'Swift', 'Kotlin', 'Dart', 'Django', 'FastAPI', 'Vue / Nuxt', 'React', 'Compose Multiplatform', 'Flutter', 'MongoDB', 'MySQL', 'AWS (ECS / RDS / SageMaker)', 'Docker', 'GitHub Actions']

    const bioSegments = (line: string) => line.split('*').map((text, i) => ({ text, em: i % 2 === 1 }))

    useSiteSeo({
        title: 'About',
        description: "Lucas, a self-taught full-stack developer who'd rather teach you the why than hand you the answer. Over 7 years of Python, JavaScript, Kotlin and Swift across web and mobile.",
        type: 'profile'
    })

    useScrollReveal()
</script>
