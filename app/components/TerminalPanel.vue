<template>
  <!-- Every empty state opens with this terminal: a real command that comes
       back with nothing, then a waiting prompt. Decorative, so it is hidden
       from screen readers; the copy beside it carries the message. -->
  <div class="term" aria-hidden="true">
    <div class="term-bar">
      <span class="tdot tdot--close" />
      <span class="tdot tdot--min" />
      <span class="tdot tdot--max" />
      <span class="term-label">{{ label }}</span>
    </div>
    <div class="term-body">
      <!-- Text is interpolated so the template compiler keeps its spacing. -->
      <div v-for="(line, i) in lines" :key="i" :class="['term-line', `term-line--${line.kind}`]">
        <template v-if="line.kind === 'cmd'">
          <span class="pmpt">$</span> {{ line.arg ? `${line.text} ` : line.text }}<span v-if="line.arg" class="arg">{{ line.arg }}</span>
        </template>
        <span v-else-if="line.kind === 'cmt'" class="cmt">{{ line.text }}</span>
        <template v-else>{{ line.text }}</template>
      </div>
      <div class="term-line term-line--cmd"><span class="pmpt">$</span> <span class="blink" /></div>
    </div>
  </div>
</template>

<script setup lang="ts">
    export type TerminalLine =
        | { kind: 'cmd', text: string, arg?: string }
        | { kind: 'out', text: string }
        | { kind: 'cmt', text: string }

    defineProps<{ label: string, lines: TerminalLine[] }>()
</script>
