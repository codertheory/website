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
- `nuxt.config.ts` enables modules: `@nuxt/content` (markdown-driven content), `@nuxt/eslint`, `@nuxt/fonts` (use this for Fraunces / Inter / JetBrains Mono / Caveat — do not pull from Google Fonts CDN), `@nuxt/hints`, `@nuxt/icon`, `@nuxt/image`.
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
- **Signature shadow style**: hard offset "stamp" shadows (e.g. `0 6px 0 var(--bulb-deep)`), not soft blurs. The primary button grows its stamp from `6px → 8px` on hover for a "press up off page" effect.
- **Hero animations** (gears spinning, 16 halo dots pulsing with 0.16s stagger, dashed loop flow) must be gated behind `prefers-reduced-motion` and an opt-out class `body.no-bulb-anim`.
- **Drop-shadow gotcha**: `filter: drop-shadow(...)` for the bulb glow goes on the **inner SVG**, not the outer wrapper — wrapping it produces a rectangular halo instead of following the bulb shape.
- The "scribble underline" under the active nav link and emphasized words is a hand-drawn Caveat-font SVG (`ScribbleUnder`), not a CSS underline.
