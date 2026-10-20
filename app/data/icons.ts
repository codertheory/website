// One place that turns the names used in content (stacks, platforms, skills,
// tools, links) into icons. Content stays plain text: a name with no entry
// here simply renders without an icon.
//
// Brand marks come from Simple Icons, generic ones from Lucide. Everything is
// drawn in the current text colour, so the logos sit in the site's palette
// instead of a dozen brand colours.
//
// Apple's own frameworks (SwiftData, CloudKit, AppKit, ScreenCaptureKit,
// WhisperKit) have no published marks, so they stay text, as do Room, QuickJS
// and discord.py. SwiftUI uses the Swift mark it shares.

export const TECH_ICONS: Record<string, string> = {
    // languages
    'Swift': 'simple-icons:swift',
    'SwiftUI': 'simple-icons:swift',
    'TypeScript': 'simple-icons:typescript',
    'Python': 'simple-icons:python',
    'Kotlin': 'simple-icons:kotlin',
    'Kotlin Multiplatform': 'simple-icons:kotlin',
    'Dart': 'simple-icons:dart',
    // frameworks and libraries
    'Nuxt': 'simple-icons:nuxt',
    'Nuxt 4': 'simple-icons:nuxt',
    'Nuxt Content': 'simple-icons:nuxt',
    'Vue / Nuxt': 'simple-icons:vuedotjs',
    'React': 'simple-icons:react',
    'Django': 'simple-icons:django',
    'FastAPI': 'simple-icons:fastapi',
    'Flutter': 'simple-icons:flutter',
    'Compose Multiplatform': 'simple-icons:jetpackcompose',
    'Ktor': 'simple-icons:ktor',
    'PrimeVue': 'simple-icons:primevue',
    // data and services
    'Redis': 'simple-icons:redis',
    'MongoDB': 'simple-icons:mongodb',
    'MySQL': 'simple-icons:mysql',
    'Notion API': 'simple-icons:notion',
    'Cloudflare Workers': 'simple-icons:cloudflareworkers',
    'AWS': 'simple-icons:amazonwebservices',
    'AWS (ECS / RDS / SageMaker)': 'simple-icons:amazonwebservices',
    'Docker': 'simple-icons:docker',
    'GitHub Actions': 'simple-icons:githubactions',
    'Resend': 'simple-icons:resend',
    'Turnstile': 'simple-icons:cloudflare',
    // tools (Uses page)
    'Xcode': 'simple-icons:xcode',
    'JetBrains IDEs': 'simple-icons:jetbrains',
    'Claude Code': 'simple-icons:claude',
    'uv': 'simple-icons:uv',
    // platforms
    'iOS': 'simple-icons:apple',
    'macOS': 'simple-icons:apple',
    'Android': 'simple-icons:android',
    'Discord': 'simple-icons:discord',
    'Web': 'lucide:globe'
}

export const UI_ICONS = {
    github: 'simple-icons:github',
    mail: 'lucide:mail',
    globe: 'lucide:globe',
    download: 'lucide:download',
    play: 'lucide:play',
    appStore: 'simple-icons:appstore',
    googlePlay: 'simple-icons:googleplay',
    apple: 'simple-icons:apple',
    android: 'simple-icons:android'
} as const

// The platform filter on /projects. These are kinds of project, not brands,
// so Desktop and Bot use generic marks.
export const FILTER_ICONS: Record<string, string> = {
    'All': 'lucide:layout-grid',
    'iOS': 'simple-icons:apple',
    'Web': 'lucide:globe',
    'Desktop': 'lucide:monitor',
    'CLI': 'lucide:terminal',
    'Bot': 'lucide:bot'
}

type Link = { label: string, href: string, kind?: string }

// Picks an icon for a project link from where it goes, then what it says.
export const linkIcon = (link: Link): string => {
    const { href, label } = link
    if (/github\.com/.test(href)) return UI_ICONS.github
    if (/apps\.apple\.com/.test(href)) return UI_ICONS.appStore
    if (/testflight\.apple\.com/.test(href)) return UI_ICONS.apple
    if (/play\.google\.com/.test(href)) return UI_ICONS.googlePlay
    if (/android/i.test(label)) return UI_ICONS.android
    if (/download/i.test(label)) return UI_ICONS.download
    if (/^play\b/i.test(label)) return UI_ICONS.play
    return UI_ICONS.globe
}

// Every icon the site can show, so the build bundles exactly these and no
// icon is ever fetched from a third party at runtime.
export const ALL_ICONS = [...new Set([...Object.values(TECH_ICONS), ...Object.values(UI_ICONS), ...Object.values(FILTER_ICONS)])]
