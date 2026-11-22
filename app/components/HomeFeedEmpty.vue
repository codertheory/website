<template>
  <div class="es-block es-block--feed">
    <TerminalPanel label="~ /codertheory" :lines="lines" />
    <p class="es-feed">
      Nothing posted lately, though the <em>workshop light</em> is on and something's brewing.
    </p>
  </div>
</template>

<script setup lang="ts">
    import type { TerminalLine } from './TerminalPanel.vue'

    // The newest things in both folders, and there are none.
    const lines: TerminalLine[] = [
        { kind: 'cmd', text: 'ls -t', arg: './projects ./posts | head -6' }
    ]
</script>
