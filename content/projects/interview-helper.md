---
title: InterviewHelper
tag: A macOS panel that listens to both sides of an interview call and ticks off the talking points you prepared. Your own written notes, glanceable mid-sentence — nothing generated.
date: 2026-09-09
status: active
statusLabel: Active
platforms:
  - macOS
type: Desktop
started: Jul 2026
stack:
  - Swift
  - SwiftUI
  - AppKit
  - ScreenCaptureKit
  - WhisperKit
icon: I
iconImage: /interview-helper-app-icon-512.png
tone: coral
links:
  - label: Download for macOS
    href: 'https://pub-ce734f5d22364b119423e4911c068868.r2.dev/InterviewHelper-1.0.0.dmg'
    kind: site
features:
  - t: Your own notes, ticking themselves off
    d: Write your answers once as cards — question, cues, and the short beats you want to hit. The app hears the question, opens the card you wrote for it, and checks off each point as you actually say it.
  - t: The Nook
    d: A notch-shaped panel at the top-centre of the screen, right beside the webcam, so glancing at your notes still reads as looking at the camera. It floats over the call and never steals keyboard focus.
  - t: Nothing generated, nothing sent
    d: There is no generative model in the app. Whisper and the retrieval model download once and run on-device, so nothing the app needs mid-interview touches the network — slow wifi on interview day can't stall it.
  - t: Every session becomes the next round of prep
    d: Records the call, transcribes it with real speaker labels, and files what you were asked but hadn't prepared for. Across sessions it names the beats you chronically drop.
why: |
  I prepare for interviews properly — pages of notes, cue cards, full answers written out for every question I expect. Then the nerves arrive and none of it comes back to me mid-sentence. I know the answer; I blank on it, usually on the last beats, the lesson learned and the guardrail added — the parts that make an answer land. So I built the thing that reads my own cue cards back to me: it listens, finds the card I wrote for the question being asked, and ticks off the points as I say them, so the only thing still lit on screen is what I haven't covered yet. To be clear about what it is *not* — there is no AI writing answers here. Every word on that panel is a word I wrote in advance, for the questions I expected. The app just makes sure I don't leave any of it in the notes.
---

## What it is

InterviewHelper is a macOS app that answers exactly one question, glanceably, in the middle of a sentence:

**What haven't I said yet?**

It listens to both sides of an interview call — your microphone for you, the call app's audio for them — matches what the interviewer asked against a bank of answer cards *you* wrote, and puts that card on screen with your talking points beside it. As you cover each point, it ticks off. What stays lit is what you still owe the answer.

It does not write answers. There is no generative model in the app — the cards, the phrasing and the beats are all yours, written in advance, and the app's entire job is recognition and bookkeeping. There is exactly one exception, off by default and labelled on screen; it gets its own section below rather than a footnote.

## The Nook

The app has no main window and no Dock icon. It *is* a floating, non-activating panel hugging the top-centre of the screen — the Nook — placed there deliberately, next to the webcam, so a glance at your notes still looks like a glance at the camera. Clicking it never takes keyboard focus from the call.

Three states:

- **Pill** — a slim capsule with a breathing dot, naming what it's capturing (`listening · Teams · rec`).
- **Working** — a shimmer while audio is in the transcription queue.
- **Presenting** — the card: the interviewer's question verbatim, your full written answer on the left, your points on the right. Unsaid points are large with a filled dot; a covered one flashes a check, lingers a moment so a wrong tick can be undone, then slides out.

Global hotkeys do the rest while the call has focus — start/stop listening, an answer picker with search over every question, cue and beat, file the last question as unprepped, step a presentation deck.

## Coverage, not sequence

The points are a checklist, not a teleprompter. People tell stories out of order, so there is no "current" beat — only covered and uncovered. Ticking is deliberately biased toward *under*-ticking: a beat that stays lit after you said it costs one redundant sentence, while a beat that ticks off wrongly means you skip your best material and never find out. Every point can also be toggled by hand, because a beat that looks unsaid but was said is a lie the glance believes.

## Matching

The interviewer's channel is heard in **turns**, not fragments — their speech accumulates until they go quiet or you start answering, so a question that arrives as ten transcription segments over thirty seconds is still one question. Then two passes:

1. **Cues** — phrases you wrote for each card, matched at word boundaries. A hit opens the card outright; it isn't a guess.
2. **Retrieval** — the turn is embedded on-device and ranked against every card. Above your confidence threshold the card opens with the percentage on it; below it, a panel shows the question verbatim with the closest cards one click away.

A bare follow-up — "Why?", "how did you measure that?" — never switches cards. It opens the card's *If they push* layer, the depth you wrote for exactly that moment.

## The one exception, labelled as such

Everything above is recognition, not generation. There is one deliberate exception, it is off by default, and it lives outside the app: **consult**. Turn it on and each interviewer turn is written to a folder that a Claude Code session on your own machine picks up. It reads your bank and the repo you point it at, and replies with the card that fits — or, only when nothing in the bank does, two to five short bullets grounded in your own notes and your own code.

The app never waits on it. Your card opens instantly and the verdict lands afterwards: agreement, a chip alongside the answer you're already giving, or points rendered under **Drafted — not your words**. That label is the entire point of the feature. Bullets get said in your own voice; paragraphs get recited, and reciting is audible from the other side of the call.

It's off by default because turning it on has a real cost: your interviewer's questions and the project you point it at leave your machine and reach Anthropic through your own Claude session. Settings says that in plain words instead of burying it.

## Before the interview

- **Pre-flight** — a checklist that both models are on disk, the mic and output are bound, the call app is found, the bank is loaded.
- **Test every input** — macOS reports a dead microphone as *success* plus a stream of digital zeros. That cost me two interviews, so the app opens each device for a second and tells you which ones are actually alive; the pill won't claim to be listening until it has heard you say a word.
- **Rehearse** — run any card against yourself through the real pipeline, ending in a scorecard whose dropped beats are the drill list.
- **Print Prep Sheet** — the whole bank as one printable page. No mic, no model, no app. The fallback for the morning the audio doesn't work.

## After the interview

Stopping asks the real question first: keep this session? Keeping it leaves a stereo recording (you left, them right), two mono tracks, a transcript with speaker labels that are a fact of the channels rather than a diarization guess, a debrief, and a log.

The Review window plays the recording with the transcript following along — click any line to seek, name the people who were speaking, and a cleaned-up copy is written beside the raw one, never over it.

Then the loop closes: questions nothing in the bank came close to get filed with the nearest card and its score, so the fix is obvious. Cards the retriever can't tell apart get flagged as pairs. And across every session, the beats you chronically drop — the measured version of the problem the app exists to solve.

## The bank is the actual work

One JSON file per interview. The line format is the whole grammar:

```
Rolled back first, debugged second :: rolled back, revert, bleeding [DELIBERATE]
```

Left of `::` is what you see on the card; right are the words you'd actually say, including the paraphrases; the tag sets your posture before the sentence starts. Cues are what the *interviewer* would say — write them the way people actually ask. Rules that make it work: beats are memory jogs under about eight words, or you'll read them aloud; six sharp cards beat forty vague ones.

## Under the hood

ScreenCaptureKit captures the call app's audio only (the video path is starved to 2×2 pixels — the app never records your screen), AVAudioEngine takes the mic. Both feed a per-source voice-activity gate that flushes on a pause, into a single serialized WhisperKit instance, into the matcher. SwiftUI for the views, AppKit for the panel behaviour that SwiftUI can't express. Signed with a Developer ID, notarized, and auto-updating through Sparkle — which refuses to interrupt while a session is live.

## Scope

A personal tool, and honest about it: no App Store, no onboarding, no multi-user anything. Also no stealth — no screen-share exclusion, no process hiding, nothing built so the interviewer can't tell. These are my own notes on my own screen, which is the same thing as a page on the desk.
