<template>
  <svg viewBox="0 0 24 24" :width="size" :height="size" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
</template>

<script setup lang="ts">
    withDefaults(defineProps<{ size?: number | string }>(), { size: 16 })
</script>
