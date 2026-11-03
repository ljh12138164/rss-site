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
      const init: RequestInit = {
        method: 'POST',
        redirect: 'manual',
        headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(offset === 0 ? { section: source.section, source: source.id } : {}),
          events: events.slice(offset, offset + 100),
          ...(skills.length ? { skills: skills.slice(offset, offset + 100) } : {}),
          batchId: change.batchId
        })
      }
      let delivered = false
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const response = await fetch(new URL('/api/revalidate', siteUrl), {
            ...init,
            signal: AbortSignal.timeout(5000)
          })
          if (response.ok) {
            const result = (await response.json()) as { revalidated?: boolean }
            delivered = result.revalidated === true
            if (delivered) break
          } else {
            await response.body?.cancel()
            if (response.status < 500 && response.status !== 429) return 'failed'
          }
        } catch {
          // Retrying only this notification never repeats the committed ingestion.
        }
        if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)))
      }
      if (!delivered) return 'failed'
    }
    return 'revalidated'
  } catch {
    return 'failed'
  }
}
