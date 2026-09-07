import type { SignalSource } from './sources.js'

export async function publishSourceUpdate(
  source: SignalSource
): Promise<'revalidated' | 'failed' | 'disabled'> {
  const siteUrl = process.env.WEB_APP_URL
  const secret = process.env.REVALIDATE_SECRET
  if (!siteUrl && !secret) return 'disabled'
  if (!siteUrl || !secret) return 'failed'
  try {
    const response = await fetch(new URL('/api/revalidate', siteUrl), {
      method: 'POST',
      redirect: 'error',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: source.section, source: source.id }),
      signal: AbortSignal.timeout(5000)
    })
    if (!response.ok) return 'failed'
    const result = (await response.json()) as { revalidated?: boolean }
    return result.revalidated === true ? 'revalidated' : 'failed'
  } catch {
    return 'failed'
  }
}
