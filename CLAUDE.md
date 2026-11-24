# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start dev server at http://localhost:3000
- `npm run build` — production build
- `npm run generate` — static site generation
- `npm run preview` — preview the production build locally
- `npx eslint .` — lint (config is `eslint.config.mjs`, which extends Nuxt's auto-generated `.nuxt/eslint.config.mjs`; run `nuxt prepare` first if `.nuxt/` is missing — `npm install` does this automatically via `postinstall`)

There is no test framework configured.

## Architecture

This is a **Nuxt 4** (Vue 3) project for **codertheory.dev**, the personal brand umbrella under which all products are released.

- Source root is `app/` (Nuxt 4 default — components, pages, layouts, composables go here, not at the project root).
- Entry: `app/app.vue` — currently scaffolded with `<NuxtWelcome />`; replace with the real shell + `<NuxtPage />` when implementing routes.
- `nuxt.config.ts` enables modules: `@nuxt/content` (markdown-driven content), `@nuxt/eslint`, `@nuxt/fonts` (use this for Fraunces and Recursive — do not pull from Google Fonts CDN), `@nuxt/hints`, `@nuxt/icon`, `@nuxt/image`.
- TypeScript: `tsconfig.json` is a thin file that delegates to the four configs Nuxt generates under `.nuxt/` — do not add `compilerOptions` here; configure via `nuxt.config.ts` instead.
- Routing: file-based via `app/pages/`. Project detail and blog post pages will use `[slug].vue` dynamic routes per the design spec.
- Content: blog posts and project copy are expected in a `content/` directory consumed by `@nuxt/content` (the design handoff explicitly says markdown content drives copy; the design dictates only structure and styling).

## Vue SFC conventions

Enforced by ESLint (`eslint.config.mjs`) — `npx eslint . --fix` will reorder/reindent.

- **Block order**: `<template>` → `<script>` → `<style>` (`vue/block-order`).
- **Script indent**: 4 spaces, with `baseIndent: 1` so script body is indented one level deeper than the `<script>` tag (`vue/script-indent`).

## Design system — required reading before any UI work

`design_handoff_codertheory_redesign/` is the **source of truth** for the redesign. Everything in `app/` is currently a blank Nuxt scaffold; the active task is recreating the designs in this Nuxt codebase as Vue SFCs.

- `design_handoff_codertheory_redesign/README.md` — full spec: design tokens (colors, type, spacing, shadows, motion), page-by-page layouts, component inventory mapping CSS classes → Vue component names, and interaction behavior. Read it before touching pages or components.
- `ct.css` — design tokens as CSS custom properties. Lift these into the Nuxt project's global stylesheet verbatim (variable names matter; both light and dark themes are defined as `[data-theme="dark"]` overrides on `<html>`).
- `*.jsx` files — Babel-in-the-browser JSX prototypes, **not production code to copy**. Treat them as visual + interaction specs and re-express idiomatically as Vue SFCs.
- `hero-logo.svg` — logo source of truth, do not redraw. `hero-logo-inner.js` is the same SVG flattened for path-level CSS targeting (used to color all paths via `color: var(--bulb)` and animate gears/dots).
- `codertheory.html` + `tweaks-panel.jsx` — interactive prototype with a tweaks panel for accent color / font / motion. The tweaks panel is design-tooling only; **omit it from production**.

### Non-obvious design conventions

- **Theming**: light/dark is toggled by setting `data-theme="light"|"dark"` on `<html>`, persisted in `localStorage` under `ct-theme`, with `prefers-color-scheme` as the first-load default.
- **Signature shadow style**: hard offset "stamp" shadows (`0 6px 0 var(--stamp)`), never with a soft blur stacked under them. The stamp is reserved for the primary button (grows `6px → 8px` on hover) and the one real showcase screenshot; panels and cards carry no shadow.
- **Hero animations** (gears spinning, 16 halo dots pulsing with 0.16s stagger, dashed loop flow) must be gated behind `prefers-reduced-motion` and an opt-out class `body.no-bulb-anim`.
- **Drop-shadow gotcha**: `filter: drop-shadow(...)` for the bulb glow goes on the **inner SVG**, not the outer wrapper — wrapping it produces a rectangular halo instead of following the bulb shape.
- The "scribble underline" is hand-drawn, never a CSS text underline. It appears in exactly two places: the active nav link (an SVG background on `.nav-link.is-active::after` in shell.css) and "Type" in the homepage h1 (`ScribbleUnder`). Other page headings stay plain.

### Visual direction ("bench ledger"), which supersedes the handoff where they differ

- **Type**: Fraunces for display. Recursive (Linear) for body, replacing the handoff's Inter. Monospace is Recursive with the MONO axis: any rule that sets `font-family: var(--f-mono)` must also set `font-variation-settings: var(--fv-mono)`.
- **Labels**: sentence case everywhere, including status ("Active") and dates. No uppercase, no wide tracking, no `//` code-comment prefixes. Mono is for metadata and dates, with `tabular-nums`, at 12px minimum.
- **Colour**: amber is for fills, stamps and underlines. Text in amber uses `--bulb-text`. No coloured words inside headlines or body copy. Emphasis is weight (600 in ink), not italic or colour.
- **Weights**: Fraunces headings at 500 (600 for the wordmark only). Body 400 to 600. No negative letter spacing below 16px.
- **Surfaces**: flat paper separated by 1px rules. One level of container at most (no bordered boxes inside a card). Opaque nav, no glass, no radial glows, no gradients standing in for images.
- **Spacing**: every padding, margin and gap is a multiple of 4 (1 to 3px nudges inside small controls excepted). Prefer the `--s-1`…`--s-8` scale in `tokens.css` (4 · 8 · 12 · 16 · 24 · 40 · 64 · 104). No inline `style` for layout.
- **Radius**: `--r-sm` 4 for tags and chips, `--r-md` 8 for every control (buttons, inputs, filters, nav links), `--r-lg` 12 for cards, `--r-xl` 16 for panels. Pills are not used; round icon buttons and dots are circles.
- **Icons**: UI icons (`ArrowRight`, `ExternalIcon`, theme icons) at their default size (16, external 14) with a 1.5 stroke. Do not pass ad hoc `:size` values.
- **Motion**: only the bulb animations, the scribble draw-in and the stamp press. Hovers are colour, border or surface changes. Name transitioned properties (never `transition: all`) and never animate layout properties like `gap`, width or margins. No scroll reveals, pulsing dots or hover rotations.
- **Empty states**: every empty state opens with `TerminalPanel` (kept by request): a real command that comes back empty (`ls -la ./posts`, `grep -ril "<query>"`, `cd` into a missing path on the 404), then a waiting prompt, followed by the real copy and actions. Commands print only what the shell would print; no invented output. No skeleton cards or placeholder content. The cursor blink is the only other looping motion and stops under reduced motion.
