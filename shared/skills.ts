export interface SkillDetail {
  skillId: string
  name: string
  source: string
  sourceType: string
  upstreamUrl: string
  installUrl: string | null
  description: string | null
  skillMarkdown: string | null
  contentHtml: string | null
  totalInstalls: number | null
  contentHash: string | null
  detailState: string
}

export function validSkillId(id: string) {
  const parts = id.split('/')
  return (
    (parts.length === 2 || parts.length === 3) &&
    parts.every(
      (part) =>
        part.length <= 150 &&
        /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(part) &&
        part !== '.' &&
        part !== '..'
    )
  )
}

export function skillPath(id: string) {
  return validSkillId(id) ? `/skills/${id.split('/').map(encodeURIComponent).join('/')}` : null
}

export function skillInstallCommand(detail: Pick<SkillDetail, 'installUrl' | 'skillId'>) {
  if (!detail.installUrl || !validSkillId(detail.skillId)) return null
  try {
    const url = new URL(detail.installUrl)
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      !/^[a-zA-Z0-9:/._-]+$/.test(detail.installUrl)
    )
      return null
    return `npx skills add ${detail.installUrl} --skill ${detail.skillId.split('/').at(-1)}`
  } catch {
    return null
  }
}

export function readSkillJsonFeed(
  json: string
): { detail: SkillDetail; installs: number | null; position: number }[] {
  const feed = JSON.parse(json) as { items?: unknown[] }
  if (!Array.isArray(feed.items)) throw new Error('Invalid Skills JSON Feed')
  return feed.items.map((value: unknown, index: number) => {
    if (!value || typeof value !== 'object') throw new Error('Invalid Skills entry')
    const item = value as Record<string, unknown>
    const extra = item._extra as { skills?: Record<string, unknown> } | undefined
    const metadata = extra?.skills
    if (metadata?.version !== 1 || typeof item.id !== 'string' || !validSkillId(item.id))
      throw new Error('Invalid Skills metadata')
    const count = (value: unknown) =>
      typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null
    const webUrl = (value: unknown) => {
      if (typeof value !== 'string') return null
      try {
        const url = new URL(value)
        return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password
          ? url.href
          : null
      } catch {
        return null
      }
    }
    const url = webUrl(item.url)
    if (
      !url ||
      typeof item.title !== 'string' ||
      typeof metadata.source !== 'string' ||
      typeof metadata.sourceType !== 'string' ||
      !['github', 'well-known'].includes(metadata.sourceType) ||
      item.id !== `${metadata.source}/${item.id.split('/').at(-1)}`
    )
      throw new Error('Invalid Skills source')
    const text =
      metadata.state === 'ready' &&
      typeof item.content_text === 'string' &&
      new TextEncoder().encode(item.content_text).length <= 131072
        ? item.content_text
        : null
    const html =
      typeof item.content_html === 'string' &&
      new TextEncoder().encode(item.content_html).length <= 524288
        ? item.content_html
        : null
    const detail: SkillDetail = {
      skillId: item.id,
      name: item.title.replace(/^#\d+\s+/, ''),
      source: metadata.source,
      sourceType: metadata.sourceType,
      upstreamUrl: url,
      installUrl: webUrl(metadata.installUrl),
      description: typeof item.summary === 'string' ? item.summary : null,
      skillMarkdown: text,
      contentHtml: text ? html : null,
      totalInstalls: count(metadata.totalInstalls),
      contentHash: typeof metadata.hash === 'string' ? metadata.hash : null,
      detailState: text
        ? 'ready'
        : typeof metadata.state === 'string' &&
            ['missing', 'error', 'oversize'].includes(metadata.state)
          ? metadata.state
          : 'missing'
    }
    return { detail, installs: count(metadata.installs), position: index + 1 }
  })
}
