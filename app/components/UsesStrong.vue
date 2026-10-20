<template>
  <strong><TechIcon :name="name" /><slot /></strong>
</template>

<script setup lang="ts">
    // Used only on the Uses page, where each tool is introduced in bold. When
    // the bold text is a tool with an icon, the icon goes in front of it.
    const slots = useSlots()
    const name = computed(() => {
        const nodes = slots.default?.() ?? []
        const text = nodes.map(n => (typeof n.children === 'string' ? n.children : '')).join('').trim()
        return text || undefined
    })
</script>
