#!/usr/bin/env node
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(import.meta.url), '../..')
const OUT = resolve(ROOT, 'app/data/github.json')
const LOGIN = process.env.GITHUB_LOGIN || 'LucasCoderT'
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
const WEEKS = 26

const LEVEL = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 }

const QUERY = `
  query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalPullRequestReviewContributions
        restrictedContributionsCount
        totalRepositoriesWithContributedCommits
        totalRepositoriesWithContributedPullRequests
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays { date contributionCount contributionLevel }
          }
        }
      }
    }
  }
`

if (!TOKEN) {
  console.warn('[fetch-github-stats] GITHUB_TOKEN not set — leaving existing github.json untouched.')
  process.exit(0)
}

const to = new Date()
const from = new Date(to.getTime() - WEEKS * 7 * 24 * 60 * 60 * 1000)

const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
    'User-Agent': `${LOGIN}-codertheory-build`
  },
  body: JSON.stringify({
    query: QUERY,
    variables: { login: LOGIN, from: from.toISOString(), to: to.toISOString() }
  })
})

if (!res.ok) {
  console.error(`[fetch-github-stats] HTTP ${res.status}: ${await res.text()}`)
  process.exit(1)
}

const { data, errors } = await res.json()
if (errors?.length) {
  console.error('[fetch-github-stats] GraphQL errors:', JSON.stringify(errors, null, 2))
  process.exit(1)
}

const c = data.user.contributionsCollection
const weeks = c.contributionCalendar.weeks.slice(-WEEKS)

// 7 rows (Sun..Sat) × N cols (weeks, oldest left). Source order is row-major to match the CSS grid.
const empty = () => ({ date: null, count: 0, level: 0 })
const rows = Array.from({ length: 7 }, () => Array.from({ length: weeks.length }, empty))
weeks.forEach((week, w) => {
  for (const day of week.contributionDays) {
    const dow = new Date(`${day.date}T00:00:00Z`).getUTCDay()
    rows[dow][w] = {
      date: day.date,
      count: day.contributionCount,
      level: LEVEL[day.contributionLevel] ?? 0
    }
  }
})

const reposTouched = Math.max(
  c.totalRepositoriesWithContributedCommits,
  c.totalRepositoriesWithContributedPullRequests
)

const payload = {
  generatedAt: to.toISOString(),
  windowDays: WEEKS * 7,
  login: LOGIN,
  contributions: c.contributionCalendar.totalContributions,
  commits: c.totalCommitContributions,
  pullRequests: c.totalPullRequestContributions,
  issues: c.totalIssueContributions,
  reviews: c.totalPullRequestReviewContributions,
  restricted: c.restrictedContributionsCount,
  reposTouched,
  heatmap: rows.flat()
}

await mkdir(dirname(OUT), { recursive: true })
await writeFile(OUT, `${JSON.stringify(payload, null, 2)}\n`)
console.log(`[fetch-github-stats] wrote ${OUT} (${payload.contributions} contributions, ${payload.pullRequests} PRs, ${payload.reposTouched} repos)`)
