import type { SignalSource } from './sources.js'

export async function publishSourceUpdate(
  source: SignalSource,
  change: { changed: boolean; events: string[]; batchId: string }
): Promise<'revalidated' | 'failed' | 'disabled' | 'unchanged'> {
  if (!change.changed) return 'unchanged'
  const siteUrl = process.env.WEB_APP_URL
  const secret = process.env.REVALIDATE_SECRET
  if (!siteUrl && !secret) return 'disabled'
  if (!siteUrl || !secret) return 'failed'
  try {
    const events = [...new Set(change.events)]
    for (let offset = 0; offset < Math.max(1, events.length); offset += 100) {
      const response = await fetch(new URL('/api/revalidate', siteUrl), {
        method: 'POST',
        redirect: 'error',
        headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(offset === 0 ? { section: source.section, source: source.id } : {}),
          events: events.slice(offset, offset + 100),
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
