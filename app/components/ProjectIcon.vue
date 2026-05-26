<template>
    <template v-if="image">
        <img
            :src="image"
            :alt="alt"
            :class="['proj-icon-img', { 'proj-icon-img--light': imageDark }]"
            width="100"
            height="100"
        >
        <img
            v-if="imageDark"
            :src="imageDark"
            alt=""
            aria-hidden="true"
            class="proj-icon-img proj-icon-img--dark"
            width="100"
            height="100"
        >
    </template>
    <template v-else>{{ glyph }}</template>
</template>

<script setup lang="ts">
    defineProps<{
        image?: string
        imageDark?: string
        glyph?: string
        alt: string
    }>()
</script>
