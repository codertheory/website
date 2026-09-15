import { defineStatSource } from '../utils/stats'

/**
 * Recent releases and reach across public repos.
 *
 * Deliberately uses the GitHub token that already exists rather than adding a
 * credential. App Store Connect and Play Console numbers would say more about
 * the mobile work, but both need their own API keys set up first.
 */
const QUERY = `
  query($login: String!) {
    user(login: $login) {
      repositories(
        first: 100
        privacy: PUBLIC
        isFork: false
        ownerAffiliations: [OWNER]
        orderBy: {field: PUSHED_AT, direction: DESC}
      ) {
        totalCount
        nodes {
          name
          url
          description
          stargazerCount
          pushedAt
          primaryLanguage { name }
          releases(first: 1, orderBy: {field: CREATED_AT, direction: DESC}) {
            nodes { name tagName publishedAt url isPrerelease }
          }
        }
      }
    }
  }
`

type Release = {
    repo: string
    name: string
    tag: string
    publishedAt: string
    url: string
    prerelease: boolean
}

export type ShippingStats = {
    publicRepos: number
    totalStars: number
    languages: Array<{ name: string, repos: number }>
    releases: Release[]
}

type Node = {
    name: string
    url: string
    stargazerCount: number
    primaryLanguage: { name: string } | null
    releases: { nodes: Array<{ name: string | null, tagName: string, publishedAt: string, url: string, isPrerelease: boolean }> }
}

export default defineStatSource<ShippingStats>({
    key: 'shipping',
    label: 'GitHub releases and reach',
    ttlMs: 6 * 60 * 60 * 1000,
    fetch: async () => {
        const config = useRuntimeConfig()
        const token = config.githubToken
        const login = (config.public.githubLogin as string) || 'LucasCoderT'
        if (!token) {
            throw new Error('GITHUB_TOKEN not configured (runtimeConfig.githubToken)')
        }

        const res = await $fetch<{ data?: { user?: { repositories?: { totalCount: number, nodes: Node[] } } }, errors?: unknown[] }>(
            'https://api.github.com/graphql',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'User-Agent': `${login}-codertheory-site`
                },
                body: { query: QUERY, variables: { login } }
            }
        )

        if (res.errors?.length) {
            throw new Error(`GitHub GraphQL errors: ${JSON.stringify(res.errors)}`)
        }

        const repos = res.data?.user?.repositories
        const nodes = repos?.nodes || []

        const languages = new Map<string, number>()
        for (const repo of nodes) {
            const lang = repo.primaryLanguage?.name
            if (lang) languages.set(lang, (languages.get(lang) || 0) + 1)
        }

        const releases: Release[] = nodes
            .flatMap(repo => repo.releases.nodes.map(r => ({
                repo: repo.name,
                name: r.name || r.tagName,
                tag: r.tagName,
                publishedAt: r.publishedAt,
                url: r.url,
                prerelease: r.isPrerelease
            })))
            .filter(r => r.publishedAt)
            .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
            .slice(0, 10)

        return {
            publicRepos: repos?.totalCount || 0,
            totalStars: nodes.reduce((sum, r) => sum + (r.stargazerCount || 0), 0),
            languages: [...languages.entries()]
                .map(([name, count]) => ({ name, repos: count }))
                .sort((a, b) => b.repos - a.repos || a.name.localeCompare(b.name)),
            releases
        }
    }
})
