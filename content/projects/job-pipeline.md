---
title: Job Pipeline
tag: A private dashboard that reads my Notion job-tracker and turns it into a pipeline view. One Nuxt app deployed as a single Cloudflare Worker, with no auth code in it at all.
date: 2026-09-24
status: active
statusLabel: Active
platforms:
  - Web
type: Web app
started: Jul 2026
stack:
  - Nuxt 4
  - TypeScript
  - Cloudflare Workers
  - Notion API
  - PrimeVue
icon: J
tone: blue
links:
  - label: GitHub
    href: 'https://github.com/LucasCoderT/job_tracker'
    kind: code
features:
  - t: Notion stays the source of truth
    d: All the data entry happens in Notion where it already was. This reads that database and folds it into a conversion strip, weekly velocity, and a searchable board, so there are no two places to keep in step.
  - t: No auth code in the app
    d: Cloudflare Access sits in front of the custom domain and the Worker never learns what a session is. There are no passwords, no tokens and no login route to get wrong, and workers.dev is off so nothing can slip past it.
  - t: The charts are hand-rolled
    d: CSS bars and small inline SVG, written as Vue template elements so they render during SSR. The one charting dependency went out the door with the Sankey and nothing has needed it since.
  - t: It feeds InterviewHelper
    d: Press Build pack on a job and it assembles an answer bank for that interview, which InterviewHelper then imports. Cards can be edited from a phone and the edit writes back to Notion.
why: |
  I was tracking applications in Notion and Notion is fine for typing things into, but it will not tell you the thing you actually want to know, which is whether any of this is working. So I built a read-only layer on top that answers it. The part I did not expect to care about is the daily snapshot. Statuses mutate in place in Notion, so once a row flips from applied to rejected the earlier state is just gone and there is no history to chart. A cron writes the day's counts into KV so there is something to look back at later. It is also where I keep finding excuses to learn the Cloudflare platform properly, which is most of why it exists at all.
---

## What it is

A single-page dashboard over the Notion database I already track applications in. It reads that database and renders a conversion strip, trend cards, a weekly velocity chart, a reply-rate breakdown by where the job came from, and a searchable board.

Notion stays the place I type things into. This is read-mostly analytics sitting on top, so I am never keeping two systems in step.

## The auth story is that there isn't one

Cloudflare Access sits in front of the Worker's custom domain, so the app itself contains no auth code. No sessions, no passwords, no tokens, no login route. `workers_dev` is deliberately off, because that hostname would route around Access and undo the whole arrangement.

Because access is gated at the edge before a request ever reaches the Worker, the API is free to return company names and Notion links without thinking about it.

## Why there is a cron

Notion mutates statuses in place. The moment a row flips from applied to rejected, the fact that it used to be applied is gone, and there is no way to reconstruct when anything happened. So a scheduled task writes the day's counts and metrics into KV, which is the only reason any of the trend lines exist.

Stats are edge-cached for a few minutes as well, so Notion sees a handful of queries an hour no matter how often I reload it.

## Interview packs

The one thing the dashboard writes rather than reads. Pressing Build pack on a job assembles an answer bank for that specific interview, which [InterviewHelper](/projects/interview-helper) then imports and reads back to me while I am talking.

The pack page shows every card, a printable prep sheet, and the JSON the app consumes. Cards can be edited or added from a phone, and each save writes the row back into Notion so regenerating the pack later keeps the edit.

## Under the hood

Nuxt 4 and Nitro built with the `cloudflare_module` preset, which comes out as a single ESM Worker. Aggregation happens server-side and the client only ever receives the shapes it needs, never a raw Notion payload. PrimeVue does the shell, KV holds the snapshots and the packs, and `shared/types.ts` is the one definition of the API payload that both halves import.

The dataviz is plain CSS bars and inline SVG written as Vue template elements, so it all renders during SSR. There is no charting library. `d3-sankey` left when the Sankey did and nothing has wanted it back.

## It used to be one file

The first two versions were a hand-written Worker in `src/index.js`, with the entire frontend living in a `PAGE_HTML` template string and no build step at all. That got me a long way, and then it got hard to change.

v3 is the Nuxt rewrite. Same deploy model and the same Access arrangement, but typed, and split into files I can find things in. The old file is still in the repo as a reference for how the imperative version worked.

## Scope

It runs for one person and is not reachable without being on the allow list, so there is no onboarding, no multi-user anything, and no public URL to put here. The repo is open if you want to see how it fits together.
