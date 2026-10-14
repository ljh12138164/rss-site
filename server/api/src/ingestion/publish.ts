import type { SignalSource } from '@rss-site/signals'

export type PublicationStatus = 'revalidated' | 'failed' | 'disabled' | 'unchanged'

export async function publishSourceUpdate(
  source: SignalSource,
  change: { changed: boolean; events: string[]; skills?: string[]; batchId: string },
  environment: { webAppUrl?: string; revalidateSecret?: string } = {
    webAppUrl: process.env.WEB_APP_URL,
    revalidateSecret: process.env.REVALIDATE_SECRET
  }
): Promise<PublicationStatus> {
  if (!change.changed) return 'unchanged'
  const siteUrl = environment.webAppUrl
  const secret = environment.revalidateSecret
  if (!siteUrl && !secret) return 'disabled'
  if (!siteUrl || !secret) return 'failed'
  try {
    const events = [...new Set(change.events)]
    const skills = [...new Set(change.skills ?? [])]
    for (let offset = 0; offset < Math.max(1, events.length, skills.length); offset += 100) {
      const response = await fetch(new URL('/api/revalidate', siteUrl), {
        method: 'POST',
        redirect: 'error',
        headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(offset === 0 ? { section: source.section, source: source.id } : {}),
          events: events.slice(offset, offset + 100),
          ...(skills.length ? { skills: skills.slice(offset, offset + 100) } : {}),
          batchId: change.batchId
        }),
        signal: AbortSignal.timeout(5000)
      })
      if (!response.ok) return 'failed'
      const result = (await response.json()) as { revalidated?: boolean }
      if (result.revalidated !== true) return 'failed'
    }
    return 'revalidated'
  } catch {
    return 'failed'
  }
}
