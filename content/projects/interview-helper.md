---
title: InterviewHelper
tag: A macOS panel that listens to both sides of an interview call and ticks off your talking points as you cover them. The notes are ones you wrote yourself, and the app never writes any for you.
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
ogImage: /interview-helper-og.png
tone: coral
links:
  - label: Download for macOS
    href: 'https://pub-ce734f5d22364b119423e4911c068868.r2.dev/InterviewHelper-1.0.0.dmg'
    kind: site
features:
  - t: Your notes tick themselves off
    d: You write each answer once as a card with the question, the phrases that should trigger it, and the few short beats you want to land. When the interviewer asks, the app opens your card and checks the beats off as you say them.
  - t: The Nook
    d: A notch-shaped panel at the top of the screen, right next to the webcam, so looking at your notes still looks like looking at the camera. It floats above the call and never takes keyboard focus away from it.
  - t: No model writing your answers
    d: There is no generative model in the app. Whisper and the retrieval model download once and then run on your own machine, so nothing it needs during an interview depends on the network. Bad hotel wifi cannot stall it.
  - t: Each session feeds the next one
    d: It records the call and transcribes it with real speaker labels, then files away any question you had no card for. Over several sessions it works out which beats you keep dropping.
why: |
  I prepare for interviews properly, pages of notes and cue cards and full answers written out for every question I think is coming. Then the nerves show up and none of it comes back to me while I am actually talking. It is not that I do not know the answer, I know it and I blank on it, usually on the last beats, the lesson I learned and the guardrail I added afterwards, which are the parts that make an answer worth anything. So I built the thing that reads my own cue cards back to me while I talk. It listens, finds the card I wrote for whatever was just asked, and ticks the points off as I cover them, so the only thing still lit on screen is what I have not said yet. I want to be clear about one thing, there is no AI writing answers here. Every word on that panel is one I wrote in advance for questions I expected. The app just makes sure I do not leave any of it sitting in the notes.
---

## What it is

InterviewHelper is a macOS app built to answer one question while you are still talking:

**What haven't I said yet?**

It listens to both sides of the call, your microphone for you and the call app's audio for them, then matches what the interviewer asked against a bank of answer cards you wrote. The card that fits goes on screen with your talking points beside it, and each point ticks off as you cover it. Whatever is still lit is what you haven't said.

It does not write answers. There is no generative model in the app at all, the cards and the wording and the beats are all yours, written ahead of time, and the app just recognises them and keeps count. There is one exception to that, it ships switched off, and it gets its own section further down.

## The Nook

The app has no main window and no Dock icon. What it has is the Nook, a floating panel that sits at the top of the screen and never activates. It lives up there next to the webcam on purpose, so a glance at your notes still looks like a glance at the camera. Clicking it doesn't pull focus away from the call.

It shows up in three states. As a pill it is a slim capsule with a breathing dot naming what it is capturing (`listening · Teams · rec`), and it shimmers instead while audio is sitting in the transcription queue.

The third one is the card. The interviewer's question written out, your full answer down the left, your points down the right. Points you have not made yet are large with a filled dot, and one you have covered flashes a check, sits there a moment in case the tick was wrong, then slides away.

Global hotkeys handle the rest without the call ever losing focus. You can start and stop listening, open a picker that searches every question, cue and beat you've written, file the last thing you were asked as unprepped, or step through a presentation deck.

## The checklist

The points behave like a checklist rather than a teleprompter. People tell stories out of order, so the app never tracks a current beat. A point is either covered or it isn't.

Matching is biased toward missing a tick rather than adding one. If a point stays lit after you've said it, you repeat yourself for a sentence and no real harm is done. If it ticks off when you haven't said it, you skip your best material and never find out you did. You can also toggle any point by hand, which matters, because a point showing as unsaid when you already said it is worse than useless at a glance.

## Matching

The app hears the interviewer in whole turns rather than fragments. Their speech accumulates until they stop or you start answering, so a question that arrives as ten separate transcription segments over thirty seconds still counts as one question. It then runs two passes over that turn.

First it looks for cues, the phrases you wrote against each card, matched at word boundaries. A hit opens that card straight away with no confidence score on it, because it is not a guess. If no cue fires, the turn gets embedded on your own machine and ranked against every card you have, and anything above your confidence threshold opens with the percentage shown. Anything below that goes to a panel with the question as it was asked and the nearest few cards sitting one click away.

A bare follow-up like "Why?" or "how did you measure that?" never swaps the card out. It opens that card's *If they push* layer instead, which is the extra depth you wrote for exactly that moment.

## The one exception

Everything above is the app recognising things you already wrote. One feature does genuinely generate text, it runs outside the app, it ships switched off, and it is called consult. Turn it on and each interviewer turn gets written to a folder where a Claude Code session on your own machine picks it up, reads your bank and whatever repo you point it at, then answers with the card it thinks fits. If nothing in the bank fits, it writes two to five short bullets built out of your own notes and your own code.

The app never blocks on any of that. Your own card opens immediately and the second opinion lands whenever it lands, either agreeing with you, or as a small chip next to the answer you are already giving, or as bullets under a heading that reads *Drafted, not your words*. That label matters more than the feature does, because bullets you can put into your own words as you go, whereas paragraphs you end up reciting and reciting is audible from the other end of a call.

It ships off because switching it on costs you something real. Your interviewer's questions and whatever project you pointed it at leave your machine and reach Anthropic through your own Claude session. Settings spells that out rather than burying it in a tooltip.

## Before the interview

Pre-flight in Settings runs down the boring list. Both models on disk, microphone and output bound, call app found, bank loaded.

Testing your inputs matters more than it sounds like it should. macOS will report a dead microphone as a success and then hand you a stream of digital zeros, which cost me two interviews before I worked out what was happening. So the app opens every input device for a second and tells you which ones are genuinely alive. The pill also refuses to say it's listening until it has actually heard you say a word.

Rehearsing runs any card against you through the real pipeline and ends in a scorecard. Whatever beats you dropped become the drill list.

Print Prep Sheet lays the whole bank out as one printable page. It needs no microphone, no model and nothing running at all. It's the thing I fall back on the morning the audio doesn't work.

## After the interview

Stopping asks whether you want to keep the session before it does anything else. If you keep it you get a stereo recording with you on the left channel and them on the right, two mono tracks split out, a transcript whose speaker labels come from which channel the audio was on rather than from a diarization guess, plus a debrief and a log.

The Review window plays the recording with the transcript scrolling alongside. Click any line to jump there. You can put names to the people who were speaking, and the tidied copy gets written next to the raw transcript rather than over the top of it.

After that the loop closes on itself. Any question nothing in the bank came close to gets filed with the nearest card and its score, which usually makes the fix obvious. Cards the retriever can't tell apart get flagged in pairs. And across every session it has logged, it can tell you which beats you keep dropping, which is the problem I built the whole thing for, finally in a form I can measure.

## The bank

One JSON file per interview. There is really only one line format to learn:

```
Rolled back first, debugged second :: rolled back, revert, bleeding [DELIBERATE]
```

Left of the `::` is what you see on the card, right of it are the words you would actually say with the paraphrases included, and the tag in brackets sets your posture before you start the sentence. Cues work differently, because those are what the *interviewer* says, so write them the way people actually ask.

Two rules do most of the work here. Keep beats under about eight words or you will end up reading them aloud, and six sharp cards will beat forty vague ones every time.

## Under the hood

ScreenCaptureKit captures the call app's audio and nothing else, with the video path starved down to 2x2 pixels so the app never records your screen, and AVAudioEngine handles the microphone. Both streams feed a voice-activity gate that flushes when you pause, then one serialised WhisperKit instance, then the matcher. SwiftUI does the views and AppKit does the panel behaviour SwiftUI cannot express.

It is signed with a Developer ID, notarised, and updates itself through Sparkle, which refuses to interrupt while a session is live.

## Scope

It is a personal tool and does not pretend otherwise, so there is no App Store listing, no onboarding, and nothing built for a second user. There is also nothing in it designed to hide it from the interviewer, it does not exclude itself from screen sharing and it does not disguise its process.

These are my own notes on my own screen, which as far as I can tell is the same as having a page on the desk.
