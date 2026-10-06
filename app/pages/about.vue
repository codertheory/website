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

          <h2 class="about-meta">The path so far</h2>
          <p class="about-meta-sub">// roughly chronological</p>
          <ul class="timeline">
            <li v-for="(t, i) in timeline" :key="i" class="fade-up">
              <div class="when">{{ t.when }}</div>
              <div class="what">{{ t.what }}</div>
              <div class="where">{{ t.where }}</div>
            </li>
          </ul>

          <h2 class="about-meta">What I work in</h2>
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
    import { timeline } from '~/data/timeline'

    const bio = [
        "I'm Lucas, a self-taught full-stack developer who'd rather teach you the *why* than hand you the answer.",
        "Over 7 years building web applications, mostly Python (Django, FastAPI) on the back and Vue/Nuxt or React on the front, with the AWS underneath it. Lately I have been deep in Kotlin Multiplatform and Swift, shipping a manga reader to iOS and Android.",
        'Codertheory is where I keep the things I make and the things I think out loud about. Take whatever is useful.'
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
