<template>
  <NuxtLayout>
    <div class="page wrap notfound">
      <div class="crumb-eyebrow">{{ error.statusCode || 404 }} / not found</div>
      <h1 class="h-section">
        That page <span class="scribble">isn't here<ScribbleUnder /></span> — let's go back.
      </h1>
      <div class="cta">
        <a class="btn btn--primary" href="/" @click.prevent="handleError">
          Take me home <ArrowRight />
        </a>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
    import type { NuxtError } from '#app'

    defineProps<{ error: NuxtError }>()

    const handleError = () => clearError({ redirect: '/' })
</script>
