import type { StatSource } from '../utils/stats'
import github from './github'
import shipping from './shipping'

/**
 * Registry of every stat source the site exposes.
 * Add new sources by importing them and dropping them into this array.
 */
export const statSources: StatSource[] = [github, shipping]

export const findStatSource = (key: string): StatSource | undefined =>
    statSources.find(s => s.key === key)
