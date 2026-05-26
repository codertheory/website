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
tone: blue
features:
  - t: Inventory + groceries
    d: One app for the laptop in your bag and the eggs in your fridge. Categories, quantities, expiration dates, photos, custom fields.
  - t: Sharing by location
    d: Rooms are the unit of sharing — invite a roommate to a single shared kitchen, leave the rest private. Powered by CloudKit Sharing.
  - t: AI-assisted import
    d: Snap a receipt or paste a product URL; Cresthold parses the item, fills the fields, and tags the marketplace.
  - t: Native everywhere
    d: SwiftUI on iPhone, iPad, and Mac. SwiftData for local storage, CloudKit for end-to-end encrypted sync.
why: |
  Two reasons. *One:* I've always wanted to ship a real desktop app, and Swift turned out to be the most enjoyable language I've picked up in years. *Two:* I'm between jobs. If money gets tight enough that I'm selling things I don't strictly need, I want a real inventory of them — so I can decide what to part with instead of opening drawers in a panic.
---

## What it is

Cresthold tracks three intertwined things — what you own, what's in your kitchen, and what you need to buy — in one native app that runs on iPhone, iPad, and Mac.

## What you can store

### Inventory items

Name, description, category, photos, price, currency, quantity, purchase date, where it lives, purchase URL, image URL, and notes. Optional fields for warranty (expiry date + notes), Amazon ASIN, marketplace, and a digital-vs-physical flag. Add custom fields when the built-ins don't fit.

Built-in categories cover Clothes, Appliances, Tech, Games, Subscriptions, Software, Furniture, Books, and Other — and you can add your own.

### Locations

Rooms and nested sub-locations, each with their own icon and color. Locations double as the sharing unit: invite someone to your kitchen and they see only the kitchen, not the rest of the house.

### Groceries

Quantity, unit, expiration date, purchase date, price, category (Produce, Dairy, Meat & Seafood, Bakery, Frozen, Beverages, Snacks, Pantry Staples, Household, Other), storage zone (Fridge, Freezer, Pantry, Counter, Spice Rack, Under Sink, Other), plus a "consumed" state for what's actually been eaten.

### Shopping lists

Multiple lists, each item with quantity, unit, category, and notes. Check items off as you shop. Optional sync to Apple Reminders. An item on a list can link back to the grocery it'll restock — so you stop buying things you already have.

### Plus

- **Warranty documents** — attach PDFs and photos of receipts, manuals, and warranty paperwork to any item.
- **Custom fields** — text, number, date, or URL fields you define yourself.
- **Tags** — free-form labels that cut across categories.
- **Photo gallery** — multiple full-res photos per item.

## Status

1.0 isn't out yet. App Store, marketing site, and TestFlight links will land here once they're live.
