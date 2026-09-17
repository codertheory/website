/**
 * Reading time for a Nuxt Content document.
 *
 * The meta line used to say a hardcoded "3 min read" on every post, which
 * would have been wrong for all of them the moment a second post existed.
 *
 * Counts every word in the rendered body, code blocks included, on the basis
 * that a reader does spend time on code and an undercount reads worse than an
 * overcount. 200 wpm is the low end of average adult prose speed, which suits
 * technical writing.
 */
const WORDS_PER_MINUTE = 200

type MinimalNode = string | number | [string, Record<string, unknown>, ...MinimalNode[]]

const collect = (node: MinimalNode, out: string[]): void => {
    if (typeof node === 'string') {
        out.push(node)
        return
    }
    if (!Array.isArray(node)) return
    // [tag, props, ...children] — props is never text, so skip index 1.
    for (let i = 2; i < node.length; i++) collect(node[i] as MinimalNode, out)
}

export const countWords = (doc: unknown): number => {
    const body = (doc as { body?: { value?: MinimalNode[] } } | null | undefined)?.body
    if (!body?.value?.length) return 0
    const parts: string[] = []
    for (const node of body.value) collect(node, parts)
    return parts.join(' ').split(/\s+/).filter(Boolean).length
}

/** Whole minutes, never less than 1 so a short post doesn't read "0 min". */
export const readingTime = (doc: unknown): number =>
    Math.max(1, Math.round(countWords(doc) / WORDS_PER_MINUTE))
