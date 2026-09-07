import { cache } from 'react'
import { getPublicSupabaseClient } from './supabase'

export interface AiEvent {
  id: string
  slug: string
  title: string
  summary: string
  occurred_at: string
  first_published_at: string
  updated_at: string
}
export interface EventPage {
  items: AiEvent[]
  nextCursor: string | null
}
const fields = 'id,slug,title,summary,occurred_at,first_published_at,updated_at'
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
  let query = getPublicSupabaseClient()
    .from('ai_events')
    .select(fields)
    .eq('status', 'published')
    .lte('first_published_at', snapshot)
    .order('occurred_at', { ascending: false })
    .order('id', { ascending: true })
    .limit(21)
  if (after)
    query = query.or(
      `occurred_at.lt.${after.date},and(occurred_at.eq.${after.date},id.gt.${after.id})`
    )
  const { data, error } = await query
  if (error) throw new Error('Unable to load events')
  const rows = data as AiEvent[]
  const items = rows.slice(0, 20)
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
  const { data, error } = await getPublicSupabaseClient()
    .from('ai_events')
    .select(fields)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  if (error) throw new Error('Unable to load event')
  return data as AiEvent | null
})

export async function getEventSources(id: string) {
  const { data, error } = await getPublicSupabaseClient()
    .from('ai_event_articles')
    .select('position,signal_articles!inner(id,title,url,source,published_at)')
    .eq('event_id', id)
    .order('position')
  if (error) throw new Error('Unable to load event sources')
  return data as unknown as {
    position: number
    signal_articles: {
      id: string
      title: string
      url: string
      source: string
      published_at: string | null
    }
  }[]
}

export async function getRelatedEvents(id: string, articleIds: string[]) {
  if (!articleIds.length) return []
  const { data, error } = await getPublicSupabaseClient()
    .from('ai_event_articles')
    .select('ai_events!inner(id,slug,title,occurred_at)')
    .in('article_id', articleIds)
    .neq('event_id', id)
    .limit(30)
  if (error) throw new Error('Unable to load related events')
  const rows = data as unknown as {
    ai_events: Pick<AiEvent, 'id' | 'slug' | 'title' | 'occurred_at'>
  }[]
  return [...new Map(rows.map((row) => [row.ai_events.id, row.ai_events])).values()]
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
    .slice(0, 5)
}
