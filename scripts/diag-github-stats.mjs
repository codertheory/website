#!/usr/bin/env node
// Compare what the GitHub API reports for different windows so you can
// reconcile with what your profile shows. Run with GITHUB_TOKEN set.

const LOGIN = process.env.GITHUB_LOGIN || 'LucasCoderT'
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN

if (!TOKEN) {
  console.error('GITHUB_TOKEN is required.')
  process.exit(1)
}

const QUERY = `
  query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalPullRequestReviewContributions
        totalRepositoriesWithContributedCommits
        restrictedContributionsCount
      }
    }
  }
`

async function fetchWindow(label, days) {
  const to = new Date()
  const from = new Date(to.getTime() - days * 86_400_000)
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': `${LOGIN}-codertheory-diag`
    },
    body: JSON.stringify({ query: QUERY, variables: { login: LOGIN, from: from.toISOString(), to: to.toISOString() } })
  })
  const json = await res.json()
  if (json.errors) throw new Error(JSON.stringify(json.errors, null, 2))
  const c = json.data.user.contributionsCollection
  return {
    label,
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    commits: c.totalCommitContributions,
    prs: c.totalPullRequestContributions,
    issues: c.totalIssueContributions,
    reviews: c.totalPullRequestReviewContributions,
    reposWithCommits: c.totalRepositoriesWithContributedCommits,
    restricted: c.restrictedContributionsCount
  }
}

async function whoAmI() {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${TOKEN}`, 'User-Agent': `${LOGIN}-codertheory-diag` }
  })
  if (!res.ok) throw new Error(`/user ${res.status}: ${await res.text()}`)
  return res.json()
}

async function myEmails() {
  const res = await fetch('https://api.github.com/user/emails', {
    headers: { Authorization: `Bearer ${TOKEN}`, 'User-Agent': `${LOGIN}-codertheory-diag` }
  })
  if (!res.ok) return null // requires user:email scope; ok if missing
  return res.json()
}

const [me, emails, ...windows] = await Promise.all([
  whoAmI(),
  myEmails(),
  fetchWindow('6 months', 182),
  fetchWindow('1 year', 365)
])

console.log(`Querying contributions for: ${LOGIN}`)
console.log(`PAT authenticates as:        ${me.login} (id ${me.id})`)
if (me.login.toLowerCase() !== LOGIN.toLowerCase()) {
  console.log('⚠️  Login mismatch — restrictedContributionsCount will stay non-zero because the viewer is "a different user" from the API\'s perspective.')
}
if (emails) {
  console.log('\nVerified emails on the authenticated account:')
  for (const e of emails) {
    console.log(`  ${e.verified ? '✓' : '✗'} ${e.email}${e.primary ? ' (primary)' : ''}`)
  }
} else {
  console.log('\n(verified-emails list not available — token lacks user:email scope)')
}
console.log()
console.table(windows)
console.log('\nNotes:')
console.log('- "restricted" counts private contributions the token can SEE but cannot DETAIL.')
console.log('- Profile UI defaults to a calendar year and respects the "Include private contributions" toggle.')
console.log('- Commits only count on the default branch (or gh-pages) of non-fork repos, with a verified author email.')
