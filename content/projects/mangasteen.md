---
title: Mangasteen
tag: A UX-friendly, extensible manga reader for iOS and Android. Kotlin Multiplatform under the hood, with a public extension ecosystem so anyone can add a source.
date: 2026-03-08
status: wip
statusLabel: Beta
platforms:
  - iOS
  - Android
type: Mobile
started: Mar 2026
stack:
  - Kotlin Multiplatform
  - Compose Multiplatform
  - Room
  - Ktor
  - QuickJS
icon: M
iconImage: /Mangasteen_Logo.png
iconImageTile: true
tone: green
links:
  - label: TestFlight
    href: 'https://testflight.apple.com/join/qGVquvur'
    kind: store
  - label: Google Play
    href: 'https://play.google.com/store/apps/details?id=dev.codertheory.mangasteen'
    kind: store
  - label: Extension SDK
    href: 'https://github.com/codertheory/Mangasteen-extension-template'
    kind: code
  - label: Sources repo
    href: 'https://github.com/codertheory/mangasteen-repo'
    kind: code
features:
  - t: One codebase, two stores
    d: Kotlin Multiplatform + Compose Multiplatform — Android and iOS ship from the same project, with the same look, feel, and gestures on both.
  - t: Open extension ecosystem
    d: Sources are sandboxed JavaScript scripts running in an embedded QuickJS engine. Pull from the public repo or write your own from the SDK template; no app update required.
  - t: A reader designed to disappear
    d: Three modes (webtoon, manga, comic), pinch-zoom in every mode, and pull-to-load chapter navigation with a haptic confirm — no chrome buttons fighting for thumb space.
  - t: Library that scales
    d: Categories with reorderable tabs, multi-select bulk actions, tri-state chapter filters, and graceful "source missing" states so library entries don't break when an extension isn't available.
why: |
  Friends were stuck on readers that hadn't shipped a real update in months and were starting to break. I wanted to give them something that actually got maintained. It's also my first mobile app — first TestFlight, first Play Store listing, first time learning how each store actually works — and there's a quiet pleasure in making something my friends use without me having to sell it to them.
---

## What it is

Mangasteen is a cross-platform manga reader for iOS and Android, built on a single Kotlin Multiplatform codebase with a Compose Multiplatform UI. It's structured around an open extension ecosystem, so the catalog is whatever community sources you add — not a curated walled garden.

It starts with manga, but the reader and library are deliberately general; nothing in the architecture stops it from growing into other paginated mediums later.

## Reader

- **Three modes** — webtoon (vertical strip), manga (right-to-left paged), comic (left-to-right paged).
- **Pinch-zoom in every mode**, including webtoon, with images decoded at source resolution so pages stay sharp at native dimensions.
- **Pull-to-load chapter navigation** — pull past the end of a chapter to load the next, past the start for the previous. A subtle haptic confirms when you've pulled far enough.
- **Smart read-tracking** — chapters mark as read only after you reach the dedicated end card (paged) or scroll past every loaded image (webtoon). No premature ticks.
- **Next-chapter preview banner** that grows as you pull, so you know what's coming before you commit.

## Library

- **Personal library** of saved manga, organised into user-defined categories with reorderable tabs and inline rename.
- **Multi-select mode** — long-press to enter, then move, mark read/unread, update, download, or remove many at once. Bulk-action buttons stay visible and grey out when they don't apply.
- **Tri-state chapter filters** — independent Unread and Downloaded filters, each with Ignored / Include / Exclude.
- Library cards show unread counts and download status at a glance.

## Sources & extensions

- **JavaScript-based extensions** sandboxed in an embedded QuickJS engine, with Ksoup for HTML parsing.
- **Public source repo + extension template** — anyone can fork the template, write a source, and have it discoverable in the official repo.
- **Source health screen** — version, capabilities, rate limit, and pause status of every installed source, with one-tap Enable / Pin / Resume from a long-press detail sheet.
- **Graceful degradation** — sources missing from the current branch stay installed behind the scenes, so library entries re-link automatically if you switch back. Manga details, library, and the updates feed surface a clear "source missing" state instead of failing silently.

## Browse, search, and updates

- **Per-source** catalog browsing with each extension's filters and sort options.
- **Global Search** across every installed source from the Sources tab, with a filter sheet to pick which to include — your selection persists across sessions.
- **Library updates feed** showing new chapters across all your saved manga, fed by a scheduled background worker that logs each run for diagnostics.

## Downloads

Background chapter downloads via KMP WorkManager — three at a time, a visible queue, cancel any in flight. Survives app restarts on both platforms.

## Plus

- **Backup & restore** of library, categories, history, and settings — for moving devices or recovering from a reinstall.
- **Material 3 theming**, with a custom Mangosteen-fruit-inspired light + dark palette as the default.
- **Reading history** with quick resume.
- **In-app updates on Android** (silent background download, with a blocking full-screen flow for high-priority updates); iOS ships through TestFlight on every push to `main`.
- **Onboarding** — a short first-run flow that picks the reading mode and theme.

## Under the hood

MVVM + Clean Architecture with a clear Data / Presentation / Background split. Room for the local database, Ktor for networking, Coil 3 for image loading, Koin (annotations) for DI, Alarmee for cross-platform local notifications. Tested with Kotest, Compose UI Test, Ktor Mock Client, and Koin Test, with CI running `./gradlew test` on every push and PR.
