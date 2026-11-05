import { cache } from 'react'
import {
  readEvent,
  readEventLinks,
  readEventSources,
  readEvents,
  readRelatedEvents
} from './business-queries'

export interface AiEvent {
  id: string
  slug: string
  title: string
  summary: string
  occurred_at: string
  first_published_at: string
  updated_at: string
  sources?: string[]
}
export interface EventPage {
  items: AiEvent[]
  nextCursor: string | null
}
export const validEventSlug = (slug: string) =>
  slug.length <= 200 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)

export function parseEventCursor(value: string | null) {
  if (!value) return null
  if (value.length > 500) throw new Error('Invalid cursor')
  const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))
  if (
    !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/.test(parsed.id) ||
    ![parsed.date, parsed.snapshot].every(
      (date) =>
        typeof date === 'string' &&
        /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)$/.test(date) &&
        Number.isFinite(Date.parse(date))
    )
  )
    throw new Error('Invalid cursor')
  return parsed as { id: string; date: string; snapshot: string }
}

export async function getEventPage(cursor: string | null = null): Promise<EventPage> {
  const after = parseEventCursor(cursor)
  const snapshot = after?.snapshot ?? new Date().toISOString()
  const rows = await readEvents(after, snapshot)
  const items = rows.slice(0, 20)
  if (items.length) {
    const links = await readEventLinks(items.map((event) => event.id))
    const sourceIds = new Map<string, Set<string>>()
    for (const link of links as unknown as {
      event_id: string
      signal_articles: { source: string }
    }[]) {
      const ids = sourceIds.get(link.event_id) ?? new Set<string>()
      ids.add(link.signal_articles.source)
      sourceIds.set(link.event_id, ids)
    }
    for (const event of items) event.sources = [...(sourceIds.get(event.id) ?? [])]
  }
  const last = items.at(-1)
  return {
    items,
    nextCursor:
      rows.length > 20 && last
        ? Buffer.from(
            JSON.stringify({
              id: last.id,
              date: last.occurred_at,
              snapshot
            })
          ).toString('base64url')
        : null
  }
}

export const getEvent = cache(async (slug: string) => {
  if (!validEventSlug(slug)) return null
  return readEvent(slug)
})

export async function getEventSources(id: string) {
  return readEventSources(id)
}

export async function getRelatedEvents(id: string, articleIds: string[]) {
  if (!articleIds.length) return []
  const rows = await readRelatedEvents(id, articleIds)
  return [...new Map(rows.map((row) => [row.ai_events.id, row.ai_events])).values()]
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
    .slice(0, 5)
}
