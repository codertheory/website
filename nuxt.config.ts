// https://nuxt.com/docs/api/configuration/nuxt-config

const codertheoryDark = {
    name: 'codertheory-dark',
    type: 'dark',
    colors: {
        'editor.background': '#1F1B16',
        'editor.foreground': '#F4ECD7'
    },
    tokenColors: [
        {scope: ['punctuation', 'meta.brace', 'keyword.operator'], settings: {foreground: '#C7BCA1'}},
        {scope: ['keyword', 'storage', 'storage.type', 'storage.modifier'], settings: {foreground: '#F4C669'}},
        {scope: ['entity.name.function', 'support.function'], settings: {foreground: '#F4C669'}},
        {scope: ['entity.name.tag'], settings: {foreground: '#F4C669'}},
        {
            scope: ['entity.name.type', 'entity.name.class', 'support.class', 'support.type'],
            settings: {foreground: '#E8A93D'}
        },
        {scope: ['entity.other.attribute-name'], settings: {foreground: '#E8A93D'}},
        {scope: ['string', 'string.quoted'], settings: {foreground: '#B6E3A8'}},
        {scope: ['constant.numeric', 'constant.language'], settings: {foreground: '#B6E3A8'}},
        {scope: ['variable', 'variable.other', 'meta.property-name'], settings: {foreground: '#F4ECD7'}},
        {scope: ['comment', 'punctuation.definition.comment'], settings: {foreground: '#807762', fontStyle: 'italic'}}
    ]
}

export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: {enabled: true},

    runtimeConfig: {
        githubToken: '', // NUXT_GITHUB_TOKEN
        contact: {
            resendApiKey: '', // NUXT_CONTACT_RESEND_API_KEY
            toEmail: 'lucascluk@icloud.com', // NUXT_CONTACT_TO_EMAIL
            // Must be on a Resend-verified domain.
            fromEmail: 'contact@codertheory.dev' // NUXT_CONTACT_FROM_EMAIL
        },
        public: {
            githubLogin: 'LucasCoderT', // NUXT_PUBLIC_GITHUB_LOGIN
            siteUrl: 'https://codertheory.dev', // NUXT_PUBLIC_SITE_URL
            siteName: 'codertheory',
            siteDescription: 'Software, writing, and the ideas behind them. By Lucas.',
            siteAuthor: 'Lucas',
            defaultOgImage: '/icon-512.png',
            twitterHandle: '@codertheory',
            // Analytics stays off entirely unless this is set at deploy time.
            posthogKey: '', // NUXT_PUBLIC_POSTHOG_KEY
            posthogHost: 'https://us.i.posthog.com' // NUXT_PUBLIC_POSTHOG_HOST
        }
    },

    nitro: {
        experimental: {
            tasks: true
        },
        scheduledTasks: {
            // Refresh every stat source every 6 hours.
            // Cloudflare Workers maps this onto the `scheduled()` handler automatically.
            '0 */6 * * *': ['stats:refresh']
        },
        storage: {
            // Production: Cloudflare KV binding named STATS (configured below).
            stats: {
                driver: 'cloudflareKVBinding',
                binding: 'STATS'
            }
        },
        devStorage: {
            // Local dev: keep stat records on disk so we can iterate without KV.
            stats: {
                driver: 'fs',
                base: './.data/stats'
            }
        },
        cloudflare: {
            // Cloudflare-specific config (name, KV bindings, cron triggers) lives in
            // the root `wrangler.jsonc` so Cloudflare's git integration can read it.
            // Nitro reads that file at build time and merges it into the generated
            // `.output/server/wrangler.json`.
            deployConfig: true,
            nodeCompat: true
        }
    },

    modules: [
        '@nuxt/content',
        '@nuxt/eslint',
        '@nuxt/fonts',
        // '@nuxt/hints', // disabled: birpc timeout on hydration-mismatch reporting crashes dev server (1.1.1)
        '@nuxt/icon',
        '@nuxt/image',
        '@nuxtjs/turnstile',
        '@nuxtjs/sitemap'
    ],

    site: {
        // Read by @nuxtjs/sitemap for absolute URLs. Kept in step with
        // runtimeConfig.public.siteUrl, which useSiteSeo uses for canonicals.
        url: 'https://codertheory.dev',
        name: 'codertheory'
    },

    sitemap: {
        // Legal pages exist for the contact form, not for search results.
        exclude: ['/privacy', '/terms', '/search'],
        defaults: {changefreq: 'weekly', priority: 0.7},
        // Project and post routes come from content files, not app/pages.
        sources: ['/api/__sitemap__/urls']
    },

    turnstile: {
        siteKey: '' // NUXT_PUBLIC_TURNSTILE_SITE_KEY (secret: NUXT_TURNSTILE_SECRET_KEY)
    },

    $development: {
        // Cloudflare's public Turnstile test keys: widget renders and always passes.
        turnstile: {siteKey: '1x00000000000000000000AA'},
        runtimeConfig: {
            turnstile: {secretKey: '1x0000000000000000000000000000000AA'}
        }
    },

    content: {
        build: {
            markdown: {
                highlight: {
                    theme: {default: codertheoryDark},
                    langs: ['ts', 'tsx', 'js', 'jsx', 'vue', 'css', 'html', 'json', 'bash', 'shell', 'swift', 'python', 'go', 'rust', 'yaml', 'md', 'sql']
                }
            }
        }
    },

    css: [
        '~/assets/css/tokens.css',
        '~/assets/css/base.css',
        '~/assets/css/shell.css',
        '~/assets/css/components.css',
        '~/assets/css/home.css',
        '~/assets/css/projects.css',
        '~/assets/css/blog.css',
        '~/assets/css/pages.css',
        '~/assets/css/empty-states.css'
    ],

    fonts: {
        families: [
            {name: 'Fraunces', provider: 'google', weights: [400, 500, 600, 700]},
            {name: 'Inter', provider: 'google', weights: [400, 500, 600, 700]},
            {name: 'JetBrains Mono', provider: 'google', weights: [400, 500, 600]},
            {name: 'Caveat', provider: 'google', weights: [400, 500, 600, 700]}
        ]
    },

    app: {
        head: {
            htmlAttrs: {lang: 'en'},
            titleTemplate: '%s',
            link: [
                {rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg'},
                {rel: 'icon', type: 'image/png', sizes: '32x32', href: '/icon-32.png'},
                {rel: 'icon', type: 'image/png', sizes: '16x16', href: '/icon-16.png'},
                {rel: 'apple-touch-icon', href: '/apple-touch-icon.png'},
                {rel: 'manifest', href: '/site.webmanifest'},
            ],
            meta: [
                {name: 'theme-color', content: '#F4C669', media: '(prefers-color-scheme: light)'},
                {name: 'theme-color', content: '#1F1B16', media: '(prefers-color-scheme: dark)'}
            ],
            script: [
                {
                    innerHTML: "(function(){try{var s=localStorage.getItem('theme');var p=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.setAttribute('data-theme', s||(p?'dark':'light'));}catch(e){}})();",
                    tagPosition: 'head'
                }
            ]
        }
    }
})