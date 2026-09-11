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
ogImage: /mangasteen-og.png
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
    d: Kotlin Multiplatform and Compose Multiplatform mean Android and iOS ship from the same project, with the same look, feel and gestures on both.
  - t: Open extension ecosystem
    d: Sources are sandboxed JavaScript scripts running in an embedded QuickJS engine. Pull from the public repo or write your own from the SDK template. Neither one needs an app update.
  - t: A reader designed to disappear
    d: Three modes (webtoon, manga, comic), pinch-zoom in all of them, and pull-to-load chapter navigation with a haptic confirm, so no chrome buttons end up fighting for thumb space.
  - t: Library that scales
    d: Categories with reorderable tabs, multi-select bulk actions, tri-state chapter filters, and clear "source missing" states so library entries hold together when an extension isn't available.
why: |
  Friends were stuck on readers that hadn't shipped a real update in months and were starting to break. I wanted to give them something that actually got maintained. It's also my first mobile app, so it came with my first TestFlight, my first Play Store listing and my first real look at how each store works. And there's a quiet pleasure in making something my friends use without me having to sell it to them.
---

## What it is

Mangasteen is a cross-platform manga reader for iOS and Android, built on a single Kotlin Multiplatform codebase with a Compose Multiplatform UI. It's structured around an open extension ecosystem, so the catalog is whatever community sources you add rather than a curated walled garden.

It starts with manga, but the reader and library are deliberately general; nothing in the architecture stops it from growing into other paginated mediums later.

## Reader

There are three reading modes: webtoon as a vertical strip, manga paged right-to-left, and comic paged left-to-right. Pinch-zoom works in all of them, webtoon included, and images are decoded at source resolution so pages stay sharp at their native dimensions.

Chapter navigation is a pull rather than a button. Pull past the end of a chapter to load the next one, or past the start for the previous, with a subtle haptic when you've pulled far enough and a preview banner that grows as you go, so you know what's coming before you commit. Chapters only mark as read once you reach the dedicated end card in paged mode, or scroll past every loaded image in webtoon, which stops them ticking over early.

## Library

Your library holds saved manga in categories you define yourself, with reorderable tabs and inline rename. Long-press puts it into multi-select, where you can move, mark read or unread, update, download or remove many at once. The bulk-action buttons stay visible the whole time and grey out when they don't apply, rather than vanishing on you.

Unread and Downloaded filters work independently, and each has three states of Ignored, Include and Exclude. Library cards show unread counts and download status without you having to open anything.

## Sources and extensions

Extensions are JavaScript, sandboxed in an embedded QuickJS engine, with Ksoup doing the HTML parsing. There's a public source repo and an extension template, so anyone can fork it, write a source and have it discoverable in the official repo. A source health screen lists the version, capabilities, rate limit and pause status of everything installed, with one-tap Enable, Pin and Resume from a long-press detail sheet.

Sources missing from the current branch stay installed quietly in the background, so library entries re-link on their own if you switch back. Manga details, the library and the updates feed all show a clear "source missing" state rather than failing silently.

## Browse, search and updates

You can browse any single source's catalog using that extension's own filters and sort options, or run a Global Search across every installed source from the Sources tab. A filter sheet picks which sources to include and remembers the choice between sessions. The library updates feed collects new chapters across everything you've saved, fed by a scheduled background worker that logs each run so you can see what happened.

## Downloads

Chapter downloads run in the background through KMP WorkManager, three at a time, with a visible queue and the ability to cancel anything still in flight. They survive an app restart on both platforms.

## Plus

Backup and restore covers the library, categories, history and settings, for moving devices or recovering from a reinstall. Theming is Material 3, defaulting to a custom light and dark palette based on the mangosteen fruit. Reading history gives you quick resume.

Android gets in-app updates that download silently in the background, with a blocking full-screen flow reserved for high-priority ones, while iOS ships through TestFlight on every push to `main`. A short first-run flow sets the reading mode and theme.

## Under the hood

MVVM and Clean Architecture, with a clear Data, Presentation and Background split. Room for the local database, Ktor for networking, Coil 3 for image loading, Koin (annotations) for DI, Alarmee for cross-platform local notifications. Tested with Kotest, Compose UI Test, Ktor Mock Client and Koin Test, with CI running `./gradlew test` on every push and PR.
