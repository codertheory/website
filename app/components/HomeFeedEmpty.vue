<template>
  <div class="es-v6 fade-up">
    <div class="strip">
      <span class="pulse" aria-hidden="true" />
      <div>
        <div class="label">// the feed is empty</div>
        <div class="what">
          Nothing posted lately. The <em>workshop light</em> is on, though — something's brewing.
        </div>
      </div>
      <span class="ago">last update —</span>
    </div>
    <div class="ghost-feed">
      <div v-for="(kind, i) in ['Project', 'Post']" :key="i" class="ghost-card">
        <div class="gc-meta">
          <span class="chip" style="opacity:0.6">{{ kind }}</span>
          <span class="lbl">coming up</span>
        </div>
        <div class="gc-line lg" />
        <div class="gc-line md" />
        <div class="gc-line sm" />
        <div class="gc-foot">// placeholder — appears here when there's news</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
    // Static placeholder — no props, no logic.
</script>
