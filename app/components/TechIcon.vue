<template>
  <Icon v-if="icon" :name="icon" class="ti" aria-hidden="true" />
</template>

<script setup lang="ts">
    import { TECH_ICONS } from '~/data/icons'

    // Renders the icon for a stack, platform or tool name, or nothing when the
    // name has no icon. Always decorative: the name is printed beside it.
    const props = defineProps<{ name?: string, icon?: string }>()
    const icon = computed(() => props.icon || (props.name ? TECH_ICONS[props.name] : undefined))
</script>
