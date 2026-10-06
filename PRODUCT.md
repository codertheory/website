# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, weighted equally (confirmed 2026-10-05):

- **Hiring visitors.** Recruiters, hiring managers and engineers on a panel, arriving from a resume or application link and giving the site a short look. Their job is to decide whether Lucas is worth a conversation.
- **Product users.** People who find Mangasteen, Shiritori or Cresthold and land here looking for what the product is, where to get it, and who makes it.

## Product Purpose

codertheory.dev is Lucas Lukowski's personal site and the umbrella brand his products are released under. It exists to show what he has built and how he thinks about building it. It succeeds when a hiring visitor can tell within one screen who he is and see real work, and when a product user can find the product they came for.

## Positioning

The site presents both the brand and the person, with the work first. The projects and the reasoning behind them lead; the codertheory slogan and identity support them. Lucas is job-hunting, and the homepage says so quietly: a small status near the hero, not part of the headline.

What a neighbouring portfolio could not copy is the project writing: each project page explains a real motive and the consequence of a specific decision.

## Operating Context

- Hiring visitors usually arrive from a link on a resume or a job application.
- The hiring action on the site is the contact page. There is no resume file on the site.
- Project pages are driven by markdown in `content/projects/`.

## Capabilities and Constraints

- Nuxt 4 with `@nuxt/content`; pages in `app/pages/`, styles in `app/assets/css/`.
- Six projects: Job Pipeline, InterviewHelper, Cresthold, Shiritori, Mangasteen, Iceteabot.
- The homepage first viewport features Mangasteen, Shiritori and Cresthold (confirmed 2026-10-05).
- The blog route stays in the primary navigation and the hero while it has no posts (confirmed 2026-10-05).
- Lucas writes all replacement copy himself. Design work may restructure pages and flag copy that needs changing, but does not reword it for him.
- Undecided: whether a resume PDF or a LinkedIn link will be added later.

## Brand Commitments

- Name: codertheory, at codertheory.dev.
- The bulb-and-gears logo, the amber and warm-paper palette, and the hard-offset "stamp" shadows stay as they are (confirmed 2026-10-05).
- Voice: plain, modest and candid. No em dashes and no exclamation marks in anything public.

## Evidence on Hand

- Project writeups in `content/projects/*.md`.
- The Job Pipeline system diagram, `app/components/content/PipelineFlow.vue`.
- App icons and social images for every project in `public/`.
- Screenshots exist for Shiritori only. The other five projects have none, and none may be invented or mocked up as if real.
- Shiritori is live at shiritoriwithfriends.com. Mangasteen is in closed beta. Cresthold is in development.
- No blog posts exist yet. No testimonials, client logos or usage numbers exist, and none may be fabricated.

## Product Principles

1. The work leads. A visitor should see something Lucas built before they see decoration.
2. Claim only what the site can show today.
3. Serve both audiences from the same page: who he is for the hiring visitor, where the product lives for the product user.
4. The brand supports the person; it does not stand in front of him.
5. His words are his own. Structure can change around them; the sentences are his to write.
