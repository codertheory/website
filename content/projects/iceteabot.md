---
title: Iceteabot
tag: A general-purpose Discord bot for small servers. My first real project, and the one that taught me Python and made programming click.
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
tone: green
links:
  - label: GitHub
    href: 'https://github.com/LucasCoderT/iceteabot'
    kind: code
features:
  - t: Moderation toolkit
    d: Role management, kicks, bans and mute timers. The basics every small server needs.
  - t: Server utilities
    d: Welcome messages, channel cleanup, info commands. The quiet plumbing that keeps a community organized.
  - t: Fun commands
    d: The slash commands nobody plans for and everybody asks for. Quotes, reactions, in-jokes baked into code.
why: |
  My very first real project, and the one that turned programming from "fun hobby" into "career." discord.py was my introduction to async Python, to version control, and to the strange discomfort of staring at last week's code and not recognising it. I kept Iceteabot running across a few small servers for years before letting it rest.
---

## The bot

A general-purpose Discord bot built with discord.py, the kind of thing every small server eventually grows up to want. Moderation, utilities, and the fun commands you accidentally end up writing because someone in chat asks *"wouldn't it be cool if...?"*

## What it taught me

Iceteabot is where I learned async Python, the difference between "works on my machine" and "works at 3 a.m. when sixty users join at once," and the slow horror of opening last week's code and not recognising it. discord.py taught me coroutines and event loops before I had vocabulary for either.

It's also the project that taught me how much I liked programming. The version of me that started Iceteabot was a hobbyist; the one who archived it had decided to make this his career.

## Why it's archived

It served its time. The codebase was a slow-motion tour of every bad decision I'd later learn to avoid, including globals as state, no tests, and a layered tangle of try/except. Rather than rewriting it, I let it rest and moved on. The repo's still up because future me will sometimes need to remember where this all started.
