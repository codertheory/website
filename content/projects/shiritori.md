---
title: Shiritori
tag: A real-time word-chain game for two to six people. Pass the chain, don't break it.
date: 2026-03-30
status: active
statusLabel: Active
platforms:
  - Web
type: Web app
started: Feb 2023
stack:
  - Nuxt 4
  - TypeScript
  - WebSockets
  - Redis
icon: し
tone: coral
links:
  - label: Play live
    href: 'https://shiritoriwithfriends.com'
    kind: site
  - label: v1 (open source)
    href: 'https://github.com/codertheory/shiritori-v1'
    kind: code
features:
  - t: Solo vs the bot
    d: Practice on your own — chain as many words as you can, see how the bot responds.
  - t: Bots alongside friends
    d: Don't have enough humans? Fill an under-populated room with bots so the round still flows.
  - t: Difficulty modifiers
    d: Tune the loop — shorter timers, stricter chain rules, narrower dictionaries.
  - t: No accounts, just rooms
    d: Share a link. That's it. Up to six players in under thirty seconds, every room ephemeral by design.
why: |
  Shiritori is a great game and the only existing online version I could find was thin and creaky. Felt like a clean target — build a friendlier, faster version that I'd actually want to play with friends, and challenge myself to design proper realtime multiplayer along the way.
---

## What it is

Shiritori is the Japanese word-chain game: each word has to start with the last syllable of the previous one, and you keep going until someone breaks the chain. shiritoriwithfriends.com is a browser-based version playable solo against a bot or with up to six friends in a shared room over a single link.

This is the second version of the project — the current site is a full rewrite of a 2023 prototype.

## Modes

- **Solo vs the bot** — practice on your own and see how long a chain you can build.
- **Multiplayer rooms** — up to six players, no accounts, share a room link.
- **Bots alongside friends** — fill an under-populated room with bots so the round can still start when you don't have the headcount.

## Modifiers

Difficulty modifiers let you tune the gameplay loop — shorter turn timers, stricter chain rules, narrower dictionaries. Stack them for a harder game.

## Dictionary

Backed by an open lexicon. Accepts the variants players actually use (plurals, common proper nouns) while still refusing gibberish.

## Architecture

One Nuxt 4 app does both the frontend and the realtime layer. Rooms are persisted only in Redis — every game is ephemeral, nothing is kept between sessions. The WebSocket layer handles turn coordination, validation, and broadcasting.

## The 2023 prototype

The current site is a rewrite of an older version, [`shiritori-v1`](https://github.com/codertheory/shiritori-v1) — a Python + Vue full-stack experiment from early 2023. It worked, but the realtime story was creaky and the codebase had grown messy. The rewrite is leaner — one Nuxt project, one WebSocket layer, one Redis instance — and the gameplay loop got the iteration it always deserved. v1 is still up on GitHub for posterity.
