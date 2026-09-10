export interface GitHubRepositoryDetails {
  avatarUrl: string | null
  description: string | null
  forks: number | null
  language: string | null
  name: string
  owner: string | null
  stars: number | null
}

const ownerPattern = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i
const metadataLabel = /(?:^|\s)(?:Language|Stars|Forks):\s*/i

function metadataValue(summary: string, label: 'Language' | 'Stars' | 'Forks') {
  const match = summary.match(
    new RegExp(`${label}:\\s*(.*?)(?=\\s+(?:Language|Stars|Forks):|$)`, 'i')
  )
  return match?.[1]?.trim() || null
}

function countValue(value: string | null) {
  if (!value || !/^[\d,]+$/.test(value)) return null
  const count = Number.parseInt(value.replaceAll(',', ''), 10)
  return Number.isSafeInteger(count) ? count : null
}

export function parseGitHubRepository({
  author,
  summary,
  title,
  url
}: {
  author: string | null
  summary: string | null
  title: string
  url: string
}): GitHubRepositoryDetails {
  let pathOwner: string | null = null
  let pathName: string | null = null

  try {
    const repositoryUrl = new URL(url)
    if (repositoryUrl.hostname === 'github.com') {
      const [owner, name] = repositoryUrl.pathname.split('/').filter(Boolean)
      pathOwner = owner ?? null
      pathName = name ?? null
    }
  } catch {
    // The outbound page performs final URL validation; metadata simply degrades here.
  }

  const titleParts = title.split('/')
  const candidateOwner = author?.trim() || pathOwner || titleParts.at(-2)?.trim() || null
  const owner = candidateOwner && ownerPattern.test(candidateOwner) ? candidateOwner : null
  const rawSummary = summary?.trim() ?? ''
  const metadataStart = rawSummary.search(metadataLabel)
  const description = (metadataStart >= 0 ? rawSummary.slice(0, metadataStart) : rawSummary).trim()

  return {
    avatarUrl: owner ? `https://github.com/${owner}.png?size=80` : null,
    description: description || null,
    forks: countValue(metadataValue(rawSummary, 'Forks')),
    language: metadataValue(rawSummary, 'Language'),
    name: pathName || titleParts.at(-1)?.trim() || title,
    owner,
    stars: countValue(metadataValue(rawSummary, 'Stars'))
  }
}
