import { defineStatSource } from '../utils/stats'
import githubFixture from '~~/app/data/github.json'

const LEVEL: Record<string, number> = {
    NONE: 0,
    FIRST_QUARTILE: 1,
    SECOND_QUARTILE: 2,
    THIRD_QUARTILE: 3,
    FOURTH_QUARTILE: 4
}

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

export type HeatmapCell = {
    date: string | null
    count: number
    level: number
}

export type GithubStats = {
    windowDays: number
    login: string
    contributions: number
    commits: number
    pullRequests: number
    issues: number
    reviews: number
    restricted: number
    reposTouched: number
    heatmap: HeatmapCell[]
}

const WEEKS = 26

type ContributionDay = { date: string, contributionCount: number, contributionLevel: string }
type ContributionWeek = { contributionDays: ContributionDay[] }
type GraphQLResponse = {
    user: {
        contributionsCollection: {
            totalCommitContributions: number
            totalPullRequestContributions: number
            totalIssueContributions: number
            totalPullRequestReviewContributions: number
            restrictedContributionsCount: number
            totalRepositoriesWithContributedCommits: number
            totalRepositoriesWithContributedPullRequests: number
            contributionCalendar: { totalContributions: number, weeks: ContributionWeek[] }
        }
    }
}

const buildPayload = (login: string, raw: GraphQLResponse): GithubStats => {
    const c = raw.user.contributionsCollection
    const weeks = c.contributionCalendar.weeks.slice(-WEEKS)

    const empty = (): HeatmapCell => ({ date: null, count: 0, level: 0 })
    const rows: HeatmapCell[][] = Array.from({ length: 7 }, () =>
        Array.from({ length: weeks.length }, empty)
    )
    weeks.forEach((week, w) => {
        for (const day of week.contributionDays) {
            const dow = new Date(`${day.date}T00:00:00Z`).getUTCDay()
            const row = rows[dow]
            if (!row) continue
            row[w] = {
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

    return {
        windowDays: WEEKS * 7,
        login,
        contributions: c.contributionCalendar.totalContributions,
        commits: c.totalCommitContributions,
        pullRequests: c.totalPullRequestContributions,
        issues: c.totalIssueContributions,
        reviews: c.totalPullRequestReviewContributions,
        restricted: c.restrictedContributionsCount,
        reposTouched,
        heatmap: rows.flat()
    }
}

export default defineStatSource<GithubStats>({
    key: 'github',
    label: 'GitHub contributions',
    ttlMs: 6 * 60 * 60 * 1000,
    fallback: () => {
        const { generatedAt: _ignored, ...rest } = githubFixture as GithubStats & { generatedAt?: string }
        return rest as GithubStats
    },
    fetch: async ({ now }) => {
        const config = useRuntimeConfig()
        const token = config.githubToken
        const login = (config.public.githubLogin as string) || 'LucasCoderT'
        if (!token) {
            throw new Error('GITHUB_TOKEN not configured (runtimeConfig.githubToken)')
        }

        const to = now
        const from = new Date(to.getTime() - WEEKS * 7 * 24 * 60 * 60 * 1000)

        const res = await $fetch<{ data: GraphQLResponse, errors?: Array<{ message: string }> }>('https://api.github.com/graphql', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'User-Agent': `${login}-codertheory-stats`
            },
            body: {
                query: QUERY,
                variables: { login, from: from.toISOString(), to: to.toISOString() }
            }
        })

        if (res.errors?.length) {
            throw new Error(`GitHub GraphQL errors: ${JSON.stringify(res.errors)}`)
        }

        return buildPayload(login, res.data)
    }
})
