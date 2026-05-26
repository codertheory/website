import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    projects: defineCollection({
      type: 'page',
      source: 'projects/*.md',
      schema: z.object({
        title: z.string(),
        tag: z.string(),
        date: z.string(),
        status: z.string().optional(),
        statusLabel: z.string().optional(),
        platforms: z.array(z.string()).optional(),
        type: z.string().optional(),
        started: z.string().optional(),
        stack: z.array(z.string()).optional(),
        icon: z.string().optional(),
        iconImage: z.string().optional(),
        iconImageDark: z.string().optional(),
        iconImageTile: z.boolean().optional(),
        tone: z.string().optional(),
        links: z.array(z.object({
          label: z.string(),
          href: z.string(),
          kind: z.string().optional()
        })).optional(),
        features: z.array(z.object({
          t: z.string(),
          d: z.string()
        })).optional(),
        why: z.string().optional(),
        screenshots: z.array(z.object({
          src: z.string(),
          alt: z.string().optional()
        })).optional()
      })
    }),
    news: defineCollection({
      type: 'page',
      source: 'news/*.md',
      schema: z.object({
        title: z.string(),
        cat: z.string(),
        date: z.string(),
        excerpt: z.string(),
        image: z.string().nullable().optional(),
        quote: z.string().optional()
      })
    }),
    now: defineCollection({
      type: 'page',
      source: 'now.md',
      schema: z.object({
        focus: z.string(),
        what: z.string(),
        href: z.string().optional(),
        updatedAt: z.string()
      })
    }),
    legal: defineCollection({
      type: 'page',
      source: 'legal/*.md',
      schema: z.object({
        title: z.string(),
        eyebrow: z.string().default('Legal'),
        updatedAt: z.string(),
        lede: z.string()
      })
    })
  }
})
