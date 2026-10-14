export async function populateSkillDetail(detail, { token, renderMarkdown, fetcher = fetch, now }) {
  if (!token) throw new Error('VERCEL_OIDC_TOKEN is required for the official Skills API')
  const response = await fetcher(
    `https://www.skills.sh/api/v1/skills/${detail.skillId.split('/').map(encodeURIComponent).join('/')}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(30000)
    }
  )
  if (response.status === 404) {
    detail.detailState = 'missing'
    return
  }
  if (!response.ok)
    throw new Error(`Skills API ${response.status}; refresh Vercel OIDC credentials if expired`)
  const data = await response.json()
  if (data.id !== detail.skillId || (data.files !== null && !Array.isArray(data.files)))
    throw new Error(`Invalid Skills API response for ${detail.skillId}`)
  const markdown = data.files?.find((file) => file.path === 'SKILL.md')?.contents
  if (typeof data.installs === 'number') detail.totalInstalls = data.installs
  if (typeof markdown !== 'string' || !markdown.trim()) {
    detail.detailState = 'missing'
    return
  }
  if (Buffer.byteLength(markdown) > 131072) {
    detail.detailState = 'oversize'
    return
  }
  detail.skillMarkdown = markdown
  detail.contentHtml = renderMarkdown(markdown.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n)?/, ''))
  detail.contentHash = data.hash ?? null
  detail.detailState = 'ready'
  detail.contentSyncedAt = now
}
