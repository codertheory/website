/**
 * Builds a `discord:component-embed` payload.
 *
 * Discord's link previews can be replaced with a Components V2 layout by
 * shipping a JSON payload in the page. Spec:
 * https://github.com/discord/discord-api-docs/pull/8606
 *
 * The payload is display-only. Buttons link out and nothing sends an
 * interaction, so no app or bot is involved. The tags in useSiteSeo still
 * matter: they are what Discord falls back to whenever this can't be used.
 *
 * Constraints enforced here, from the spec:
 *  - Only component types 1, 2, 9, 10, 11, 12, 14, 17 are allowed. Anything
 *    else invalidates the whole payload.
 *  - Buttons must be link style (5) and carry only type/url/style/label/emoji/
 *    disabled, with a label, an emoji, or both. An `id` or `custom_id` throws
 *    the payload out.
 *  - At most 40 components.
 *  - Media URLs are http(s), at most 2,048 characters.
 */

export const DISCORD_ALLOWED_TYPES = [1, 2, 9, 10, 11, 12, 14, 17] as const
export const DISCORD_MAX_COMPONENTS = 40
export const DISCORD_MAX_URL = 2048
/** Linked delivery caps the response at 3,000 bytes; stay under it inline too. */
export const DISCORD_MAX_BYTES = 3000

/** #F4C669, the brand amber, as the integer Discord expects. */
export const DISCORD_ACCENT = 0xF4C669

type Media = { url: string }
type Button = { type: 2, style: 5, url: string, label: string }
type Component =
    | { type: 10, content: string }
    | { type: 14, spacing?: number }
    | { type: 11, media: Media }
    | { type: 1, components: Button[] }
    | { type: 9, components: Component[], accessory?: Button | { type: 11, media: Media } }
    | { type: 12, items: Array<{ media: Media, description?: string }> }

export type ComponentEmbed = {
    component: { type: 17, accent_color?: number, spoiler?: boolean, components: Component[] }
}

const isUsableUrl = (url: string | undefined): url is string =>
    typeof url === 'string' && /^https?:\/\//.test(url) && url.length <= DISCORD_MAX_URL

/** Walks the tree so the 40-component cap is counted, not assumed. */
export const countComponents = (node: unknown): number => {
    if (!node || typeof node !== 'object') return 0
    const n = node as Record<string, unknown>
    let total = typeof n.type === 'number' ? 1 : 0
    for (const key of ['components', 'items']) {
        const child = n[key]
        if (Array.isArray(child)) for (const c of child) total += countComponents(c)
    }
    if (n.accessory) total += countComponents(n.accessory)
    return total
}

export type ProjectEmbedInput = {
    title: string
    tag?: string
    url: string
    image?: string
    statusLabel?: string
    platforms?: string[]
    stack?: string[]
    links?: Array<{ label: string, href: string }>
}

export const buildProjectEmbed = (p: ProjectEmbedInput): ComponentEmbed | undefined => {
    if (!p.title || !isUsableUrl(p.url)) return undefined

    const components: Component[] = []

    // Heading and one-line description, with the app icon alongside it.
    const heading: Component = {
        type: 9,
        components: [{
            type: 10,
            content: `# [${escapeMd(p.title)}](${p.url})${p.tag ? `\n${escapeMd(trim(p.tag, 240))}` : ''}`
        }]
    }
    if (isUsableUrl(p.image)) heading.accessory = {type: 11, media: {url: p.image}}
    components.push(heading)

    // Subtext line. "-# " is Discord's small-text markdown.
    const facts = [p.statusLabel, (p.platforms || []).join(' · '), (p.stack || []).slice(0, 4).join(', ')]
        .filter((v): v is string => Boolean(v && v.length))
    if (facts.length) components.push({type: 10, content: `-# ${escapeMd(facts.join('  ·  '))}`})

    // Link buttons. An action row holds five, and an empty row is invalid.
    const buttons: Button[] = (p.links || [])
        .filter(l => isUsableUrl(l.href) && l.label)
        .slice(0, 5)
        .map(l => ({type: 2, style: 5, url: l.href, label: trim(l.label, 80)}))
    if (buttons.length) {
        components.push({type: 14})
        components.push({type: 1, components: buttons})
    }

    const embed: ComponentEmbed = {
        component: {type: 17, accent_color: DISCORD_ACCENT, components}
    }
    return countComponents(embed.component) <= DISCORD_MAX_COMPONENTS ? embed : undefined
}

export type PostEmbedInput = {
    title: string
    excerpt?: string
    url: string
    image?: string
    category?: string
    date?: string
    quote?: string
    readingMinutes?: number
}

/**
 * A post has no external links or gallery, so the value over the standard card
 * is the detail around it: category, reading time, date, and the pull quote,
 * plus one unambiguous button to open it.
 */
export const buildPostEmbed = (p: PostEmbedInput): ComponentEmbed | undefined => {
    if (!p.title || !isUsableUrl(p.url)) return undefined

    const components: Component[] = []

    const heading: Component = {
        type: 9,
        components: [{
            type: 10,
            content: `# [${escapeMd(p.title)}](${p.url})${p.excerpt ? `\n${escapeMd(trim(p.excerpt, 240))}` : ''}`
        }]
    }
    if (isUsableUrl(p.image)) heading.accessory = {type: 11, media: {url: p.image}}
    components.push(heading)

    const facts = [
        p.category,
        p.readingMinutes ? `${p.readingMinutes} min read` : undefined,
        formatDate(p.date)
    ].filter((v): v is string => Boolean(v))
    if (facts.length) components.push({type: 10, content: `-# ${escapeMd(facts.join('  ·  '))}`})

    // The pull quote already uses *asterisks* for emphasis in the frontmatter,
    // which is the same syntax Discord renders, so it carries over untouched.
    if (p.quote) components.push({type: 10, content: `> ${trim(p.quote, 300).replace(/\n+/g, ' ')}`})

    components.push({type: 14})
    components.push({type: 1, components: [{type: 2, style: 5, url: p.url, label: 'Read the post'}]})

    const embed: ComponentEmbed = {
        component: {type: 17, accent_color: DISCORD_ACCENT, components}
    }
    return countComponents(embed.component) <= DISCORD_MAX_COMPONENTS ? embed : undefined
}

const formatDate = (value: string | undefined) => {
    if (!value) return undefined
    const d = new Date(value)
    return Number.isNaN(d.getTime())
        ? undefined
        : d.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'})
}

/**
 * The `image` field on a post is a layout keyword ("stack"/"other") that picks
 * a thumbnail treatment on the index, not a file. Only treat it as an image
 * when it actually looks like one, or a post ends up advertising
 * og:image=/stack and gets no preview picture at all.
 */
export const resolvePostImage = (image: string | null | undefined, siteUrl: string, fallback: string) => {
    const abs = (src: string) => /^https?:\/\//.test(src) ? src : `${siteUrl}${src.startsWith('/') ? src : `/${src}`}`
    if (image && (/^https?:\/\//.test(image) || image.startsWith('/'))) return abs(image)
    return abs(fallback)
}

const trim = (value: string, max: number) =>
    value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`

/** Square brackets would break the markdown link syntax the heading uses. */
const escapeMd = (value: string) => value.replace(/([[\]])/g, '\\$1')

/**
 * Serialises for inlining in a <script>. The body has to be the bare JSON
 * object, and `<` is escaped so a stray "</script>" in any field cannot close
 * the tag early.
 */
export const serialiseEmbed = (embed: ComponentEmbed) =>
    JSON.stringify(embed).replace(/</g, '\\u003c')
