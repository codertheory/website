---
title: Job Pipeline
tag: Something like a private Indeed with a dashboard attached. Postings come in scored and ranked, everything I apply to gets tracked from the same place, and the charts say whether any of it is working.
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
iconImage: /job-pipeline-app-icon-512.png
ogImage: /job-pipeline-og.png
tone: blue
links:
  - label: GitHub
    href: 'https://github.com/LucasCoderT/job_tracker'
    kind: code
features:
  - t: A job board with only my jobs on it
    d: Postings arrive already scored and ranked, with the pay, the stack and why it matched. I read them on my phone and either dismiss one or send it off to have a tailored CV built.
  - t: It tells me where the process leaks
    d: The headline is the step rate between stages, so the bottleneck names itself instead of me squinting at a funnel. Underneath it, a bar showing where every application is sitting right now.
  - t: History that Notion cannot keep
    d: Statuses change in place, so once a row flips the old state is gone. A daily snapshot means there are trend lines at all, which is the only way to see whether things are getting better or worse.
  - t: It feeds InterviewHelper
    d: Press Build pack on a job and it assembles an answer bank for that interview, which InterviewHelper then imports. Cards can be edited from a phone and the edit writes back to Notion.
why: |
  I was tracking applications in Notion and Notion is fine for typing things into, but it will not tell you the thing you actually want to know, which is whether any of this is working. So I built a read-only layer on top that answers it. The part I did not expect to care about is the daily snapshot. Statuses mutate in place in Notion, so once a row flips from applied to rejected the earlier state is just gone and there is no history to chart. A cron writes the day's counts into KV so there is something to look back at later. It is also where I keep finding excuses to learn the Cloudflare platform properly, which is most of why it exists at all.
---

## What it is

Two halves of the same job hunt. One is a job board that only ever has my jobs on it, where postings turn up already scored and ranked and I decide from my phone whether any of them are worth the afternoon. The other is the dashboard over everything I have actually applied to, which is the half that tells me whether the effort is going anywhere.

That second half is a conversion strip, trend cards, a weekly velocity chart, a reply-rate breakdown by where the job came from, and a searchable board. Notion stays the place I type into, and this is read-mostly analytics sitting on top, so there are never two systems to keep in step.

## How a job actually moves

:pipeline-flow

The shape worth noticing is that the Mac is never called. It sits on a desk
behind a residential connection and nothing on the internet can reach it, so
every handoff in its direction is the Mac asking whether there is anything to
do. The Worker just holds state and waits.

That also means nothing is lost if the Mac is asleep. Work queues in KV and
gets picked up whenever it next polls.

## Two things the diagram simplifies

`state` and `pack` are separate fields, not one ladder. `state` is his decision
(new, dismissed, applied) and `pack` is the Mac's progress (none, requested,
building, done, failed). Folding them together would make "dismissed, but the
pack already built" impossible to represent, which is a real thing that
happens.

And `state: applied` cannot be set directly. It is a consequence of the Notion
row existing, because claiming it without the row would put a job in the
funnel's story that the funnel has never heard of.

## The auth story is that there isn't one

Cloudflare Access sits in front of the Worker's custom domain, so the app
itself contains no auth code. No sessions, no passwords, no tokens, no login
route. `workers_dev` is deliberately off, because that hostname would route
around Access and undo the whole arrangement.

The Mac presents an Access service token for the polling in the diagram above,
so the Worker never has to tell the difference between him and a script.

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
