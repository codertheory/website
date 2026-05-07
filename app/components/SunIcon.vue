<template>
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <circle cx="12" cy="12" r="4" />
    <line v-for="a in [0, 45, 90, 135, 180, 225, 270, 315]" :key="a" x1="12" y1="3" x2="12" y2="6" :transform="`rotate(${a} 12 12)`" />
  </svg>
</template>
