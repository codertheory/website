<template>
  <figure class="pipe">
    <div class="pipe-scroll">
    <svg
      class="pipe-svg"
      viewBox="0 0 720 632"
      role="img"
      aria-label="How a job moves through the pipeline. The Mac finds and evaluates postings and pushes them to Cloudflare KV; the phone reads them and decides; the Mac polls the Worker for queued work because it cannot be reached from the internet; marking a job applied creates the Notion row that puts it in the funnel."
    >
      <defs>
        <marker id="pf-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
        </marker>
        <marker id="pf-arrow-pull" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" class="pf-pull-fill" />
        </marker>
      </defs>

      <!-- lane headings -->
      <text class="pf-lane" x="104" y="20" text-anchor="middle">career-ops · Mac</text>
      <text class="pf-lane" x="360" y="20" text-anchor="middle">Worker + KV</text>
      <text class="pf-lane" x="616" y="20" text-anchor="middle">phone</text>
      <line class="pf-rule" x1="16" y1="30" x2="704" y2="30" />

      <!-- 1. found -->
      <text class="pf-step" x="16" y="62">01 · found</text>
      <rect class="pf-box" x="24" y="72" width="160" height="40" rx="8" />
      <text class="pf-t" x="104" y="90" text-anchor="middle">07:00 standup</text>
      <text class="pf-s" x="104" y="104" text-anchor="middle">strong-match-queue</text>

      <rect class="pf-box pf-box--rec" x="264" y="72" width="192" height="40" rx="8" />
      <text class="pf-t" x="360" y="90" text-anchor="middle">POSTINGS KV</text>
      <text class="pf-s" x="360" y="104" text-anchor="middle">score · pay · stack</text>

      <rect class="pf-box" x="536" y="72" width="160" height="40" rx="8" />
      <text class="pf-t" x="616" y="90" text-anchor="middle">/postings</text>
      <text class="pf-s" x="616" y="104" text-anchor="middle">ranked list</text>

      <line class="pf-line" x1="188" y1="92" x2="258" y2="92" marker-end="url(#pf-arrow)" />
      <text class="pf-e" x="223" y="85" text-anchor="middle">PUT :id</text>
      <line class="pf-line" x1="460" y1="92" x2="530" y2="92" marker-end="url(#pf-arrow)" />

      <!-- 2. reviewed -->
      <text class="pf-step" x="16" y="154">02 · reviewed</text>
      <rect class="pf-box" x="24" y="164" width="160" height="40" rx="8" />
      <text class="pf-t" x="104" y="182" text-anchor="middle">claude -p</text>
      <text class="pf-s" x="104" y="196" text-anchor="middle">scores the posting</text>

      <rect class="pf-box pf-box--rec" x="264" y="164" width="192" height="40" rx="8" />
      <text class="pf-t" x="360" y="182" text-anchor="middle">same record, upgraded</text>
      <text class="pf-s" x="360" y="196" text-anchor="middle">+ JD + analysis</text>

      <rect class="pf-box" x="536" y="164" width="160" height="40" rx="8" />
      <text class="pf-t" x="616" y="182" text-anchor="middle">the brief</text>
      <text class="pf-s" x="616" y="196" text-anchor="middle">read on a phone</text>

      <path class="pf-pull" d="M 258 176 L 188 176" marker-end="url(#pf-arrow-pull)" />
      <text class="pf-e pf-e--pull" x="223" y="169" text-anchor="middle">polls 30m</text>
      <line class="pf-line" x1="188" y1="192" x2="258" y2="192" marker-end="url(#pf-arrow)" />
      <text class="pf-e" x="223" y="206" text-anchor="middle">upgrade</text>
      <line class="pf-line" x1="460" y1="184" x2="530" y2="184" marker-end="url(#pf-arrow)" />

      <!-- 3. decided -->
      <text class="pf-step" x="16" y="246">03 · decided</text>
      <rect class="pf-box pf-box--rec" x="264" y="256" width="192" height="40" rx="8" />
      <text class="pf-t" x="360" y="274" text-anchor="middle">pack: requested</text>
      <text class="pf-s" x="360" y="288" text-anchor="middle">or state: dismissed</text>

      <rect class="pf-box" x="536" y="256" width="160" height="40" rx="8" />
      <text class="pf-t" x="616" y="274" text-anchor="middle">Build pack</text>
      <text class="pf-s" x="616" y="288" text-anchor="middle">one tap</text>

      <line class="pf-line" x1="530" y1="276" x2="460" y2="276" marker-end="url(#pf-arrow)" />

      <!-- 4. pack built -->
      <text class="pf-step" x="16" y="338">04 · pack built</text>
      <rect class="pf-box" x="24" y="348" width="160" height="40" rx="8" />
      <text class="pf-t" x="104" y="366" text-anchor="middle">CV chain</text>
      <text class="pf-s" x="104" y="380" text-anchor="middle">tailored to the JD</text>

      <rect class="pf-box pf-box--rec" x="264" y="348" width="192" height="40" rx="8" />
      <text class="pf-t" x="360" y="366" text-anchor="middle">artifacts</text>
      <text class="pf-s" x="360" y="380" text-anchor="middle">pack: done</text>

      <rect class="pf-box" x="536" y="348" width="160" height="40" rx="8" />
      <text class="pf-t" x="616" y="366" text-anchor="middle">download</text>
      <text class="pf-s" x="616" y="380" text-anchor="middle">the PDF</text>

      <path class="pf-pull" d="M 258 360 L 188 360" marker-end="url(#pf-arrow-pull)" />
      <text class="pf-e pf-e--pull" x="223" y="353" text-anchor="middle">polls queue</text>
      <line class="pf-line" x1="188" y1="376" x2="258" y2="376" marker-end="url(#pf-arrow)" />
      <text class="pf-e" x="223" y="390" text-anchor="middle">PUT pdf</text>
      <line class="pf-line" x1="460" y1="368" x2="530" y2="368" marker-end="url(#pf-arrow)" />

      <!-- 5. applied -->
      <text class="pf-step" x="16" y="430">05 · applied</text>
      <rect class="pf-box pf-box--rec" x="264" y="440" width="192" height="40" rx="8" />
      <text class="pf-t" x="360" y="458" text-anchor="middle">Notion row created</text>
      <text class="pf-s" x="360" y="472" text-anchor="middle">state: applied follows</text>

      <rect class="pf-box" x="536" y="440" width="160" height="40" rx="8" />
      <text class="pf-t" x="616" y="458" text-anchor="middle">Mark applied</text>
      <text class="pf-s" x="616" y="472" text-anchor="middle">after applying</text>

      <line class="pf-line" x1="530" y1="460" x2="460" y2="460" marker-end="url(#pf-arrow)" />

      <!-- 6. tracked -->
      <text class="pf-step" x="16" y="522">06 · tracked</text>
      <rect class="pf-box pf-box--rec" x="264" y="532" width="192" height="40" rx="8" />
      <text class="pf-t" x="360" y="550" text-anchor="middle">Notion is the record</text>
      <text class="pf-s" x="360" y="564" text-anchor="middle">status · furthest stage</text>

      <rect class="pf-box" x="536" y="532" width="160" height="40" rx="8" />
      <text class="pf-t" x="616" y="550" text-anchor="middle">the dashboard</text>
      <text class="pf-s" x="616" y="564" text-anchor="middle">reads it back</text>

      <rect class="pf-box" x="24" y="532" width="160" height="40" rx="8" />
      <text class="pf-t" x="104" y="550" text-anchor="middle">daily cron</text>
      <text class="pf-s" x="104" y="564" text-anchor="middle">snapshot → KV</text>

      <line class="pf-line" x1="460" y1="552" x2="530" y2="552" marker-end="url(#pf-arrow)" />
      <line class="pf-line" x1="258" y1="552" x2="188" y2="552" marker-end="url(#pf-arrow)" />

      <line class="pf-rule" x1="16" y1="596" x2="704" y2="596" />
      <text class="pf-s" x="16" y="616">Notion mutates statuses in place, so the cron is the only history there is.</text>
    </svg>
    </div>
    <figcaption>
      The Mac cannot be reached from the internet, so every handoff to it is a poll.
      Amber arrows are the Mac pulling work; everything else is a push.
    </figcaption>
  </figure>
</template>

<style scoped>
.pipe { margin: 36px 0; }
/* The diagram has a fixed coordinate space, so on a narrow screen it either
   scrolls or its labels shrink into nothing. The Sankey this project used to
   have died of exactly that: an 800x400 space squeezed to 360px rendered its
   text at about 5px. Scroll instead, and never let it go below legible. */
.pipe-scroll { overflow-x: auto; overscroll-behavior-x: contain; }
.pipe-svg {
  display: block; width: 100%; min-width: 620px; height: auto;
  color: var(--ink-soft);
  overflow: visible;
}
.pipe figcaption {
  font-family: var(--f-mono); font-size: 12px; line-height: 1.6;
  color: var(--ink-mute); margin-top: 14px;
}
.pf-box { fill: var(--bg-elev); stroke: var(--rule); stroke-width: 1; }
.pf-box--rec { fill: var(--bg-sunk); }
.pf-rule { stroke: var(--rule); stroke-width: 1; }
.pf-line { stroke: currentColor; stroke-width: 1.25; opacity: 0.55; }
.pf-pull { stroke: var(--bulb-text); stroke-width: 1.5; stroke-dasharray: 4 3; fill: none; }
.pf-pull-fill { fill: var(--bulb-text); }
.pf-lane {
  font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.08em;
  text-transform: uppercase; fill: var(--ink-mute);
}
.pf-step {
  font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.06em;
  fill: var(--bulb-text);
}
.pf-t { font-family: var(--f-sans); font-size: 13px; font-weight: 600; fill: var(--ink); }
.pf-s { font-family: var(--f-mono); font-size: 10.5px; fill: var(--ink-mute); }
.pf-e { font-family: var(--f-mono); font-size: 10px; fill: var(--ink-mute); }
.pf-e--pull { fill: var(--bulb-text); }
</style>
