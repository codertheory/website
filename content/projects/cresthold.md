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
iconImageDark: /cresthold-app-icon-dark-512.png
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
    d: Snap a receipt or paste a product URL and it parses the item, fills in the fields, and tags the marketplace.
  - t: Native everywhere
    d: SwiftUI on iPhone, iPad, and Mac. SwiftData for local storage, CloudKit for end-to-end encrypted sync.
why: |
  Two reasons. I have always wanted to ship a real desktop app, and Swift turned out to be the most fun I have had with a language in years. The other one is that I am between jobs right now, and if money gets tight enough that I start selling things I do not strictly need, I want an actual list of what I own so I can decide what to let go of instead of opening drawers in a panic.
---

## What it is

Cresthold keeps track of what you own, what is in your kitchen, and what you still need to buy, in one native app across iPhone/iPad/Mac.

## What you can store

### Inventory items

Name, description, category, photos, price, currency, quantity, purchase date, where it lives, purchase URL, image URL, and notes. Optional fields for warranty (expiry date + notes), Amazon ASIN, marketplace, and a digital-vs-physical flag. Add custom fields when the built-ins don't fit.

Built-in categories cover Clothes, Appliances, Tech, Games, Subscriptions, Software, Furniture, Books, and Other. You can add your own.

### Locations

Rooms and nested sub-locations, each with their own icon and colour. Locations are also how sharing works, so you can invite someone to your kitchen and that is all they get to see.

### Groceries

Quantity, unit, expiration date, purchase date, price, category (Produce, Dairy, Meat & Seafood, Bakery, Frozen, Beverages, Snacks, Pantry Staples, Household, Other), storage zone (Fridge, Freezer, Pantry, Counter, Spice Rack, Under Sink, Other), plus a "consumed" state for what's actually been eaten.

### Shopping lists

Multiple lists, each item with quantity, unit, category, and notes. Check items off as you shop. Optional sync to Apple Reminders. An item on a list can link back to the grocery it'll restock, so you stop buying things you already have.

### Plus

You can attach warranty documents to any item, meaning PDFs and photos of receipts, manuals and paperwork. Custom fields can be text, number, date or URL, and you define them yourself. Tags are free-form labels that cut across categories, and every item takes as many full-resolution photos as you want to give it.

## Status

1.0 is not out yet. The site is up at [cresthold.app](https://cresthold.app) and the beta is open on [TestFlight](https://testflight.apple.com/join/U1T31KMf), so the App Store link is the one thing still missing and it will land here once it exists.
