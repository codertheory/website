import { statSources } from '../../sources'
import { runStatSource } from '../../utils/stats'

export default defineTask({
    meta: {
        name: 'stats:refresh',
        description: 'Pull every registered stat source and write the result to KV storage.'
    },
    async run({ payload }) {
        const onlyKey = typeof payload?.key === 'string' ? payload.key : null
        const targets = onlyKey ? statSources.filter(s => s.key === onlyKey) : statSources
        const results: Array<{ key: string, ok: boolean, generatedAt?: string, error?: string }> = []

        for (const source of targets) {
            try {
                const record = await runStatSource(source)
                console.log(`[stats:refresh] ${source.key} → ${record.generatedAt}`)
                results.push({ key: source.key, ok: true, generatedAt: record.generatedAt })
            } catch (err) {
                const error = err instanceof Error ? err.message : String(err)
                console.error(`[stats:refresh] ${source.key} failed:`, error)
                results.push({ key: source.key, ok: false, error })
            }
        }

        return { result: results }
    }
})
