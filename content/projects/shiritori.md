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
    d: Not enough people around? Fill the empty seats with bots so the round still starts.
  - t: Difficulty modifiers
    d: Sudden death, length progression, long chain. Stack them if you want a harder game.
  - t: No accounts, just rooms
    d: Share a link and that's the whole setup. Six players can be in a room inside thirty seconds, and nothing about it is kept afterwards.
screenshots:
  - src: /shots/shiritori-lobby.webp
    alt: The Shiritori home page, with the lobby creation panel showing word length, rounds, turn timeout and game mode options.
  - src: /shots/shiritori-rules.webp
    alt: The how-to-play page, explaining the last-letter chain rule, the turn timer and the three-heart elimination system.
why: |
  Shiritori is a great game and the only online version I could find was thin and kinda creaky, so I built one I would actually want to play with friends. I also wanted to make myself design realtime multiplayer properly. The first version did not really manage that, so the rewrite is me having another go at the same problem with everything I picked up since.
---

## What it is

Shiritori is the Japanese word-chain game. In this version each word has to start with the last letter of the one before it, and you keep going until someone breaks the chain. shiritoriwithfriends.com is a browser-based version playable solo against a bot or with up to six friends in a shared room over a single link.

This is the second version of the project. The current site is a full rewrite of a 2023 prototype.

## The rules it settled on

A random starting letter gets drawn and every word after it has to begin with
the last letter of the word before, with no reusing anything already played. You
get thirty seconds a turn by default, and missing the timer costs you a heart the
same as an invalid or repeated word does, so lose three and you are out. Last
player standing wins.

Hearts were the decision that made the game work socially. An instant knockout
on one mistake means the person who most needs the practice spends the round
watching, so a miss costs a life rather than the game.

## Modes

Play solo against the bot, or open a lobby for up to six people with no accounts
and nothing to share but a link. Lobbies take an optional password when you want
a private match, and bots will fill the empty seats when you are short on humans.

There's a daily challenge too: one seed shared by everyone that day, solo against
the bot, with a leaderboard for the day's best run and the all-time best.

Shiritori also runs inside Discord as an activity, which is where most games
actually happen. People are already in voice chat with the friends they want to
play with, so asking them to move to a browser tab was asking them to leave the
room.

## Modifiers

Three of them, stackable:

- **Sudden death** shortens the turn timer by two seconds every turn, down to a
  floor of five.
- **Length progression** sets a per-turn minimum word length, either climbing
  steadily or jumping around at random.
- **Long chain** makes each word match the last *two* letters of the previous
  one, which is much harder than it sounds.

Lobbies also set a minimum word length and a round cap before the game starts.

## Dictionary

Any valid English dictionary word counts, as long as it starts with the required
letter and hasn't been played yet. Proper nouns don't.

The interesting part is what happens when the dictionary is wrong. A rejected
word can be reported straight from the game screen, checked against an external
dictionary, and added if it turns out to be real. Arguing with the referee mid
game is the one piece of feedback players will reliably give you, so it seemed
worth capturing rather than losing to a shout in voice chat.

## Architecture

One Nuxt 4 app does the frontend and the realtime layer. Rooms live in Redis and nowhere else, so a game disappears when it ends and nothing carries between sessions. The WebSocket layer handles turn coordination and validation/broadcasting.

## The 2023 prototype

[`shiritori-v1`](https://github.com/codertheory/shiritori-v1) was a Python and Vue thing I built in early 2023. It worked, sort of. The realtime side was creaky and the codebase got messy fast, so I rewrote the whole lot as one Nuxt project instead of the pile of moving parts it used to be, and the gameplay loop finally got the iteration I never gave it the first time.

v1 is still up on GitHub if you want to see where it started.
