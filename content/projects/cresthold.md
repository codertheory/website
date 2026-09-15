---
title: Cresthold
tag: A SwiftUI inventory + groceries app for iPhone, iPad, and Mac. Tracks what you own, what's in your kitchen, and what you need to buy.
date: 2026-04-11
status: wip
statusLabel: Pre-release
platforms:
  - iOS
  - macOS
type: Mobile + Desktop
started: Apr 2026
stack:
  - Swift
  - SwiftUI
  - SwiftData
  - CloudKit
icon: C
iconImage: /cresthold-app-icon-512.png
ogImage: /cresthold-og.png
tone: blue
links:
  - label: Website
    href: 'https://cresthold.app'
    kind: site
  - label: TestFlight
    href: 'https://testflight.apple.com/join/U1T31KMf'
    kind: store
features:
  - t: Inventory + groceries
    d: One app for the laptop in your bag and the eggs in your fridge. Categories, quantities, expiration dates, photos, custom fields.
  - t: Sharing by location
    d: Rooms are the unit of sharing, so you can invite a roommate to one shared kitchen and keep the rest of the house private. It runs on CloudKit Sharing.
  - t: AI-assisted import
    d: Snap a receipt or paste a product URL; Cresthold parses the item, fills the fields, and tags the marketplace.
  - t: Native everywhere
    d: SwiftUI on iPhone, iPad, and Mac. SwiftData for local storage, CloudKit for end-to-end encrypted sync.
why: |
  Two reasons. *One:* I've always wanted to ship a real desktop app, and Swift turned out to be the most enjoyable language I've picked up in years. *Two:* I'm between jobs. If money gets tight enough that I'm selling things I don't strictly need, I want a real inventory of them, so I can decide what to part with instead of opening drawers in a panic.
---

## What it is

Cresthold tracks what you own, what's in your kitchen, and what you need to buy, all in one native app that runs on iPhone, iPad and Mac.

## What you can store

### Inventory items

Name, description, category, photos, price, currency, quantity, purchase date, where it lives, purchase URL, image URL, and notes. Optional fields for warranty (expiry date + notes), Amazon ASIN, marketplace, and a digital-vs-physical flag. Add custom fields when the built-ins don't fit.

Built-in categories cover Clothes, Appliances, Tech, Games, Subscriptions, Software, Furniture, Books, and Other. You can add your own.

### Locations

Rooms and nested sub-locations, each with their own icon and color. Locations double as the sharing unit: invite someone to your kitchen and they see only the kitchen, not the rest of the house.

### Groceries

Quantity, unit, expiration date, purchase date, price, category (Produce, Dairy, Meat & Seafood, Bakery, Frozen, Beverages, Snacks, Pantry Staples, Household, Other), storage zone (Fridge, Freezer, Pantry, Counter, Spice Rack, Under Sink, Other), plus a "consumed" state for what's actually been eaten.

### Shopping lists

Multiple lists, each item with quantity, unit, category, and notes. Check items off as you shop. Optional sync to Apple Reminders. An item on a list can link back to the grocery it'll restock, so you stop buying things you already have.

### Plus

You can attach warranty documents to any item, meaning PDFs and photos of receipts, manuals and paperwork. Custom fields can be text, number, date or URL, and you define them yourself. Tags are free-form labels that cut across categories, and every item takes as many full-resolution photos as you want to give it.

## Status

1.0 isn't out yet. The marketing site is up at [cresthold.app](https://cresthold.app) and the beta is open on [TestFlight](https://testflight.apple.com/join/U1T31KMf). The App Store link will land here once it's live.
