# codertheory.dev

Personal-brand site under which all of my products are published. Built on Nuxt 4 + Nitro, deployed to Cloudflare Workers with a KV-backed cron for refreshing GitHub stats.

## Stack

- **Nuxt 4** (Vue 3) — file-based routing, SFC components in `app/`
- **Nitro** — server runtime, deployed via the `cloudflare_module` preset
- **Nuxt Content** — markdown collections for blog posts, projects, and legal pages
- **Cloudflare Workers** — production runtime
- **Cloudflare KV** — persistent storage for scheduled stat refreshes
- **Cron Triggers** — every 6 hours, refreshes GitHub contribution data into KV

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
```

The dev server uses a filesystem KV mock at `.data/stats/` so the stat-source framework works without Cloudflare. Hot reload covers components, content, server routes, and the scheduled task.

### Useful commands

```bash
npm run dev          # start dev server
npm run build        # build for production (defaults to Node preset)
npm run preview      # preview production build locally
npx eslint .         # lint
npm run fetch:github # manually refresh app/data/github.json fixture (requires GITHUB_TOKEN)
npm run diag:github  # inspect raw GitHub GraphQL response for debugging
```

For a Cloudflare Workers build:

```bash
NITRO_PRESET=cloudflare_module npm run build
npx wrangler dev --config .output/server/wrangler.json
```

## Project layout

```
app/
  pages/                  # file-based routes
    index.vue             # home: who-I-am, mixed feed, GitHub heatmap
    about.vue
    contact.vue
    privacy.vue           # thin wrapper, content lives in content/legal/
    terms.vue             # thin wrapper, content lives in content/legal/
    blog/
      index.vue           # category-filtered list with empty states
      [slug].vue          # post detail (Nuxt Content markdown render)
    projects/
      index.vue           # platform-filtered list with empty states
      [slug].vue
  components/             # shared SFC components
  composables/            # useTheme, useScrollReveal
  assets/css/             # design tokens + per-area stylesheets
  data/github.json        # bundled fallback for /api/stats/github

content/
  legal/                  # privacy.md, terms.md (auto-rendered via LegalDoc.vue)
  news/                   # blog posts (committed)
  projects/               # project entries (NOT committed — author locally)
  now.md                  # /about "now" snippet

server/
  utils/stats.ts          # generic stat-source framework
  sources/                # registered stat sources (github.ts + index.ts registry)
  tasks/stats/refresh.ts  # scheduled task — runs every 6h on Workers
  api/stats/[key].get.ts  # public read endpoint, KV-backed with fixture fallback

scripts/
  fetch-github-stats.mjs  # build-time fixture refresh (prebuild hook)
  diag-github-stats.mjs   # debug helper

design_handoff_codertheory_redesign/
  README.md               # design spec — read before any UI change
  ct.css                  # design tokens (lifted into app/assets/css/tokens.css)
  *.jsx                   # interactive prototypes (visual spec, not code to copy)
```

## Authoring content

### Blog posts

Drop a markdown file into `content/news/`:

```markdown
---
title: Ship small, ship often
cat: Devlog
date: 2026-04-08
excerpt: One-sentence hook for the card and the feed.
image: stack            # optional — drives the typographic thumbnail style
quote: "*Sometimes* less code is more code"   # optional — emphasis with *…*
---

Post body in markdown.
```

`cat` shows up as the category chip and feeds the filter on `/blog`. The home feed merges posts with projects and sorts by `date`.

### Projects

Drop a markdown file into `content/projects/`. Schema in `content.config.ts` covers `title`, `tag`, `date`, `status`/`statusLabel`, `platforms`, `type`, `started`, `stack`, `icon`, `tone`, `links`, `features`, `why`. The detail page renders the markdown body underneath the structured frontmatter.

`content/projects/` is not committed to the repo — these are authored locally. If you fork this site, replace them with your own.

### Legal pages

Privacy and terms are markdown in `content/legal/`. Edit the body and frontmatter freely:

```markdown
---
title: Privacy policy
eyebrow: Legal
updatedAt: 2026-04-30
lede: Short version — explain the gist in one sentence.
---

## Section heading

Body paragraph.
```

H2s become the on-page TOC automatically. The `.vue` page wrapper is just `<LegalDoc slug="privacy" />` — adding a third legal page (e.g. cookies) is one new markdown file plus one new wrapper.

## Stat sources

A generic framework for "fetch external data on a schedule, cache it in KV, expose it via JSON API." The home page's GitHub contribution heatmap is the first source. Adding more — Spotify recents, App Store reviews, RSS subs — is a single new file.

### Adding a source

```ts
// server/sources/spotify.ts
import { defineStatSource } from '../utils/stats'

export default defineStatSource<RecentTrack[]>({
    key: 'spotify-recent',
    ttlMs: 30 * 60 * 1000,
    fallback: () => [],
    fetch: async ({ now }) => {
        // hit Spotify API, return shaped data
    }
})
```

Then register it in `server/sources/index.ts`:

```ts
import spotify from './spotify'
export const statSources: StatSource[] = [github, spotify]
```

The cron task (`server/tasks/stats/refresh.ts`) automatically picks it up. Consume it on any page via `useFetch('/api/stats/spotify-recent')`.

### Schedule + storage

- Cron: `0 */6 * * *` (every 6 hours) — declared in `wrangler.jsonc` under `triggers.crons`
- Storage: Cloudflare KV namespace `STATS` in production; filesystem at `.data/stats/` in dev
- API: every source is exposed at `/api/stats/<key>` with envelope `{ key, generatedAt, data, stale }`
- Fallback: API returns each source's `fallback()` value when KV is empty (e.g. fresh deploy before the first cron tick)

## Design system

`design_handoff_codertheory_redesign/README.md` is the source of truth for visual decisions — design tokens, component inventory, page layouts, and porting notes. Read it before any UI work.

A few non-obvious conventions:

- **Theming** — `data-theme="light"|"dark"` on `<html>`, persisted in `localStorage` under `ct-theme`, defaults to `prefers-color-scheme`.
- **Stamp shadows** — primary buttons grow their hard-offset shadow from `6px → 8px` on hover. No soft blurs.
- **Hero animations** — gears, halo dots, dashed loop. Gated behind `prefers-reduced-motion` and the `body.no-bulb-anim` opt-out class.
- **Scribble underline** — the wavy mark under the active nav link is a Caveat-font SVG (`ScribbleUnder` component), not a CSS underline.
- **Empty states** — three variants (V2 terminal, V5 filtered pill, V6 home strip) live in `app/assets/css/empty-states.css` and `app/components/Empty*.vue`. Wired into projects, blog, and home indexes.

## Deployment (Cloudflare Workers)

The site runs on Cloudflare Workers with KV for scheduled stat caching. Two paths:

### Continuous deploy (preferred — git integration)

The Cloudflare Workers Builds project is connected to this repo's `main` branch. Pushing to `main` triggers a build with:

- Build command: `NITRO_PRESET=cloudflare_module npm run build`
- Deploy command: `npx wrangler deploy --config .output/server/wrangler.json`
- Build env: `GITHUB_TOKEN` (refreshes the bundled fixture during prebuild)

### Manual deploy

```bash
NITRO_PRESET=cloudflare_module GITHUB_TOKEN=<token> npm run build
npx wrangler deploy --config .output/server/wrangler.json
```

### Runtime secrets (one-time)

```bash
npx wrangler secret put NUXT_GITHUB_TOKEN --config .output/server/wrangler.json
```

This is what the cron task uses to authenticate against GitHub's GraphQL API.

### Cloudflare config

`wrangler.jsonc` at the repo root holds Cloudflare-specific config (worker name, KV bindings, cron triggers). Nitro reads this at build time and merges it with `main`/`assets`/`compatibility_*` into `.output/server/wrangler.json` — that's the file `wrangler deploy` actually consumes.

## Conventions

- **Vue SFCs** — `<template>` → `<script>` → `<style>`, 4-space indent, script body indented one level deeper than the `<script>` tag. Enforced by `eslint.config.mjs`. Run `npx eslint . --fix` to auto-format.
- **TypeScript** — `tsconfig.json` is a thin delegate; configure via `nuxt.config.ts`.
- **No test framework** — verification happens via `npm run dev` + manual checks for now.

## License

Code is MIT-style fair-game unless a specific file says otherwise. Writing in `content/news/` and the design in `design_handoff_codertheory_redesign/` are © Lucas; ask before republishing.
