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
iconImage: /shiritori-app-icon-light.svg
iconImageDark: /shiritori-app-icon-dark.svg
ogImage: /shiritori-og.png
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
    d: Practice on your own. Chain as many words as you can and see how the bot answers back.
  - t: Bots alongside friends
    d: Don't have enough humans? Fill an under-populated room with bots so the round still flows.
  - t: Difficulty modifiers
    d: Shorter turn timers, stricter chain rules, a narrower dictionary. Stack them if you want a harder game.
  - t: No accounts, just rooms
    d: Share a link and that's the whole setup. Six players can be in a room inside thirty seconds, and nothing about it is kept afterwards.
why: |
  Shiritori is a great game and the only online version I could find was thin and creaky. Felt like a clean target. I wanted a friendlier, faster one that I'd actually want to play with friends, and I wanted to make myself design proper realtime multiplayer along the way.
---

## What it is

Shiritori is the Japanese word-chain game: each word has to start with the last syllable of the previous one, and you keep going until someone breaks the chain. shiritoriwithfriends.com is a browser-based version playable solo against a bot or with up to six friends in a shared room over a single link.

This is the second version of the project. The current site is a full rewrite of a 2023 prototype.

## Modes

You can play solo against the bot and see how long a chain you can build, or open a multiplayer room for up to six people with no accounts and nothing to share but a link. If you're short on humans, bots will fill the empty seats so the round can start anyway.

## Modifiers

Difficulty modifiers let you tune the gameplay loop with shorter turn timers, stricter chain rules and a narrower dictionary. Stack them for a harder game.

## Dictionary

The dictionary is an open lexicon. It accepts the variants players actually use, like plurals and common proper nouns, while still refusing gibberish.

## Architecture

One Nuxt 4 app does both the frontend and the realtime layer. Rooms live only in Redis, so every game disappears when it ends and nothing carries over between sessions. The WebSocket layer handles turn coordination, validation and broadcasting.

## The 2023 prototype

The current site is a rewrite of an older version, [`shiritori-v1`](https://github.com/codertheory/shiritori-v1), a Python and Vue full-stack experiment from early 2023. It worked, but the realtime side was creaky and the codebase had got messy. The rewrite is leaner, with a single Nuxt project doing what used to take several moving parts, and the gameplay loop finally got the iteration it always deserved. v1 is still up on GitHub for posterity.
