<template>
  <svg viewBox="0 0 24 24" :width="size" :height="size" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 4h6v6M10 14L20 4M19 13v6H5V5h6" />
  </svg>
</template>

<script setup lang="ts">
    withDefaults(defineProps<{ size?: number | string }>(), { size: 14 })
</script>
