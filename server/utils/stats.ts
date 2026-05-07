/**
 * Generic stat-source framework.
 *
 * A `StatSource` represents one external feed (GitHub contributions, Spotify
 * recents, App Store reviews, RSS …) that we periodically pull and cache into
 * Nitro storage. The scheduled task in `server/tasks/stats/refresh.ts` walks
 * the registry and runs each source; the API route in
 * `server/api/stats/[key].get.ts` reads from storage on demand.
 *
 * To add a new source:
 *   1. Create `server/sources/<name>.ts` exporting `defineStatSource({...})`
 *   2. Register it in `server/sources/index.ts`
 * Everything else (cron, storage, API, fallback) is handled here.
 */

export type StatRecord<T = unknown> = {
    key: string
    generatedAt: string
    data: T
}

export type StatSourceContext = {
    now: Date
}

export type StatSource<T = unknown> = {
    /** Unique identifier — used as the storage key and the URL slug at /api/stats/:key */
    key: string
    /** Human-readable label, surfaced in logs */
    label?: string
    /** Pulls the live payload. Throw to signal a transient failure; the previous record stays in storage. */
    fetch: (ctx: StatSourceContext) => Promise<T>
    /** Optional fallback used when nothing is in storage yet (e.g. bundled fixture for first deploy) */
    fallback?: () => T | Promise<T>
    /** Marks a record as stale after this many ms. Informational — does not auto-trigger a refresh. */
    ttlMs?: number
}

export const defineStatSource = <T>(source: StatSource<T>): StatSource<T> => source

const STORAGE_NAMESPACE = 'stats'

const storage = () => useStorage(STORAGE_NAMESPACE)

export const runStatSource = async <T>(source: StatSource<T>): Promise<StatRecord<T>> => {
    const now = new Date()
    const data = await source.fetch({ now })
    const record: StatRecord<T> = {
        key: source.key,
        generatedAt: now.toISOString(),
        data
    }
    await storage().setItem(source.key, record)
    return record
}

export const readStatSource = async <T>(source: StatSource<T>): Promise<StatRecord<T> | null> => {
    const record = await storage().getItem<StatRecord<T>>(source.key)
    if (record) return record
    if (source.fallback) {
        const data = await source.fallback()
        return {
            key: source.key,
            generatedAt: new Date(0).toISOString(),
            data
        }
    }
    return null
}

export const isStale = (record: StatRecord, ttlMs?: number) => {
    if (!ttlMs) return false
    const age = Date.now() - new Date(record.generatedAt).getTime()
    return age > ttlMs
}
