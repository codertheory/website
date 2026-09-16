---
title: Iceteabot
tag: A general-purpose Discord bot for small servers, and the first real thing I ever built.
date: 2019-01-02
status: archived
statusLabel: Archived
platforms:
  - Discord
type: Bot
started: '2018'
stack:
  - Python
  - discord.py
icon: 🍵
iconImage: /iceteabot-app-icon.png
iconImageTile: true
ogImage: /iceteabot-og.png
tone: green
links:
  - label: GitHub
    href: 'https://github.com/LucasCoderT/iceteabot'
    kind: code
features:
  - t: Moderation toolkit
    d: Roles, kicks/bans, mute timers. The basics every small server ends up needing.
  - t: Server utilities
    d: Welcome messages, channel cleanup, info commands. The quiet plumbing that keeps a server tidy.
  - t: Fun commands
    d: The commands you write because someone in chat asked for them. Quotes, reactions, in-jokes baked into code.
why: |
  I learned Python off YouTube videos and this is the thing I built with it, so it is the first code I ever wrote that other people actually used. discord.py was my first go at async, my first repo, and my first time opening something I wrote a week earlier and not recognising any of it. I kept it running on a few small servers for years before I let it rest. It is the project that turned programming from a hobby into the thing I wanted to do for a living.
---

## The bot

A general-purpose Discord bot built with discord.py. Moderation, utilities, and the pile of commands you end up writing because someone in chat asked *"wouldn't it be cool if...?"* and you wanted to find out.

## What it taught me

discord.py taught me coroutines and event loops before I had words for either of them, which is a strange way round to learn something but it stuck. It also taught me the difference between working on my machine and working at 3am when sixty people join at once.

I started this as a hobby and finished it having decided to do this for a living.

## Why it's archived

It ran its course. The codebase is a tour of every bad decision I have since learned to avoid, globals as state and try/except wrapped around more try/except, and I would rather leave it sitting there than rewrite it into something that pretends I knew better at the time.

The repo is still up because I like being able to see where I started.
