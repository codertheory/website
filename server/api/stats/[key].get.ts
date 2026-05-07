import { findStatSource, statSources } from '../../sources'
import { isStale, readStatSource } from '../../utils/stats'

export default defineEventHandler(async (event) => {
    const key = getRouterParam(event, 'key')
    if (!key) {
        throw createError({ statusCode: 400, statusMessage: 'missing stat source key' })
    }

    const source = findStatSource(key)
    if (!source) {
        throw createError({
            statusCode: 404,
            statusMessage: `unknown stat source: ${key}`,
            data: { available: statSources.map(s => s.key) }
        })
    }

    const record = await readStatSource(source)
    if (!record) {
        throw createError({ statusCode: 503, statusMessage: `stat source not yet populated: ${key}` })
    }

    setHeader(event, 'cache-control', 'public, max-age=60, stale-while-revalidate=600')

    return {
        ...record,
        stale: isStale(record, source.ttlMs)
    }
})
