---
title: Uses
lede: The tools I actually reach for, not the ones I mean to learn.
updatedAt: 2026-09-15
---

<!--
Hardware section goes here when you want one: machine, display, keyboard, audio.
Left out on purpose rather than guessed at.
-->

## Editors

**Xcode** for anything Swift. It is the only real option for shipping to the App
Store, and after a year of it I have stopped resenting that.

**JetBrains IDEs** for everything else. Kotlin Multiplatform work in particular
is much less painful with a toolchain that understands Gradle properly.

**Claude Code** in the terminal alongside both. Every repo I work in has a
`CLAUDE.md` at the root, which is usually the fastest way to get a new machine,
or a new collaborator, up to speed on how a project is put together.

## Languages I reach for

Swift and SwiftUI for anything Apple. Kotlin Multiplatform with Compose when
something needs to land on both phones from one codebase. TypeScript for the
web. Python when the job is a script, a scraper, or anything with a data shape
to wrangle.

## Web

**Nuxt** for sites and apps, including this one. File-based routing and
server routes in the same project means there is rarely a reason to stand up a
separate backend.

**Nuxt Content** for anything writing-shaped. Markdown in git beats a CMS for a
site only one person edits.

## Infrastructure

**Cloudflare Workers** hosts this site, with KV for cached stats and R2 for
build artifacts. The free tier is genuinely generous and deploys take seconds.

**AWS** for work that needs it: ECS, RDS, SageMaker. Most of my professional
infrastructure experience lives here rather than on Cloudflare.

**GitHub Actions** for CI. Tests on every push, builds on every tag.

## Small things that earn their keep

- **uv** for Python. It made virtualenv management a non-problem.
- **XcodeGen**, so an Xcode project file is generated from a YAML file instead
  of being a merge conflict waiting to happen.
- **Sparkle** for shipping updates to Mac apps distributed outside the store.
- **Resend** for transactional email, including the form on the contact page.
- **Turnstile** in front of that form, because the alternative is spam.
