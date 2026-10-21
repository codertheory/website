---
title: Rolesmith
tag: A Mac app for running a job search from one place. It finds postings, scores them, builds a tailored CV and cover letter, tracks every application and interview round, preps me for the call, and sits beside me while I am on it.
date: 2026-10-20
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
  - GRDB
  - CloudKit
  - ScreenCaptureKit
  - WhisperKit
icon: R
iconImage: /rolesmith-app-icon-512.png
iconImageDark: /rolesmith-app-icon-dark-512.png
ogImage: /rolesmith-og.png
tone: green
links:
  - label: Website
    href: 'https://rolesmith.codertheory.dev'
    kind: site
  - label: Download for macOS
    href: 'https://dl.codertheory.dev/interviewhelper/Rolesmith.dmg'
    kind: site
features:
  - t: One app instead of four
    d: It replaces the scripts, the job board site, the Notion databases and the old InterviewHelper app. Everything lives in one local library on my Mac, and iCloud keeps my two Macs in step.
  - t: Postings that arrive already sorted
    d: It reads job boards, company career pages and my LinkedIn and Indeed alert emails, drops the duplicates and the obvious traps, and scores what is left against my CV. A daily check closes postings whose links have died.
  - t: A tailored pack for each application
    d: For the roles worth it, it drafts the CV, the cover letter and the screening answers from my own resume and notes, checked against my writing rules. Nothing gets sent or submitted. I read it and apply myself.
  - t: Prep, then the call itself
    d: Each interview round gets a prep plan, a short research brief on the company, and a draft answer bank I mark ready before it counts. During the call it opens my cards and ticks off the points I have not said yet.
why: |
  I was running my job search across four things that never quite agreed with each other. career-ops scripts found and scored postings on the Mac, a site on Cloudflare showed them to me on my phone, Notion held the applications, and InterviewHelper did the interviews. Most of the bugs I kept fixing were the seams between them, an application on the site that never reached the tracker, a row that turned up twice in Notion. So I folded all of it into one Mac app with one library, and the seams went away with it. The name came last. It started as InterviewHelper, and once it was doing the whole search that name stopped fitting, so it is Rolesmith now, since most of the work is shaping each application to the role.
---

## What it is

Rolesmith is the whole job search in one Mac app. It looks for postings, works out which ones are worth my time, builds what I need to apply, keeps track of where every application is, and helps me prepare for and get through the interviews.

It replaces two projects that used to be on this site, the Job Pipeline dashboard and InterviewHelper.

Both live inside it now, along with the scripts that used to feed them.

## Finding the jobs

Postings come in from a few directions. It reads job boards and company career pages directly, it reads the job alert emails LinkedIn and Indeed already send me, and I can add a single posting from the Share menu in Safari. The same job showing up under three links counts once.

Every posting goes through cheap checks first. Some companies and some kinds of posting I never want to see again, like contract gigs that turn out to be AI training work, so those get skipped by rule before anything costs money. What is left gets scored against my CV, with the reasons written down, so I can see why something ranked where it did.

A posting that sits untouched for a while gets archived, and a daily check visits the links of the open ones and closes any that have gone dead. Both are reversible, and the inbox stays short enough to actually read.

## Applying

For a posting worth applying to, it builds a pack: a CV tailored to the role, a cover letter, and drafts for the screening questions. They come from my own resume and a knowledge base of my own experience, and they are checked against the same writing rules I use for everything else, so nothing claims something I have not done.

It stops there on purpose. Rolesmith never sends, submits or fills in an application form. I read what it made, change what needs changing, and apply myself.

## Interviews

When an interview gets scheduled, the round gets a prep tab. There is a plan laid out backwards from the interview time, a short research brief on the company with every claim linked to where it came from, and a draft answer bank sized to the kind of round. The bank stays marked as a draft until I go through it and mark it ready.

During the call, the old InterviewHelper part takes over. It listens to both sides, opens the card I wrote for whatever was just asked, and ticks off my points as I make them, so whatever is still lit is what I have not said yet. Afterwards there is a recording, a transcript with speaker labels and a debrief, and any question I had no card for gets filed for next time.

## Two Macs, one library

The Mac Studio on my desk does the background work, the scans and the scoring and the pack building. My laptop is where I usually read and apply. iCloud keeps one library in step between them, and either Mac can take over the background role if the other one is off.

Notifications are mine to shape. Every kind has its own hours, days and what happens outside them, and nothing interrupts while I am on a call.

## Under the hood

It is a native Swift app. SwiftUI for the windows and AppKit for the panel that floats above a call, GRDB for the local database, and CloudKit for syncing it between my Macs. WhisperKit transcribes on the machine itself, and ScreenCaptureKit captures the call audio and nothing else.

The AI parts run through the Anthropic API or my own Claude Code, with a daily spend cap. They are off for anything that runs during a live call. It is signed with a Developer ID, notarised, and updates itself through Sparkle.

## Scope

It is built for my own search first. It is a direct download rather than an App Store app, because the App Store's sandbox would take out the parts that use Claude Code and my own scripts. If it is useful to someone else, that is a nice bonus, and the [Rolesmith site](https://rolesmith.codertheory.dev) has the download and a setup guide.
