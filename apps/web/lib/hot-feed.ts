import { getPublicSupabaseClient } from './supabase'

export interface HotItemRow {
  source_key: string
  title: string
  url: string
  summary: string | null
  author: string | null
  published_at: string | null
  position: number
}

export interface SourceStatusRow {
  source: string
  item_count: number
  last_success_at: string
}

export interface FeedQueryResult {
  items: HotItemRow[] | null
  status: SourceStatusRow | null
  error: string | null
}

export type FeedQuery = (limit?: number) => Promise<FeedQueryResult>

export interface HotItem {
  sourceKey: string
  title: string
  url: string
  summary: string | null
  author: string | null
  publishedAt: Date | null
  position: number
}

export type FeedResult =
  | {
      state: 'ready'
      items: HotItem[]
      status: {
        itemCount: number
        lastSuccessAt: Date
      }
    }
  | { state: 'empty' }
  | { state: 'error' }

async function queryJuejinFeed(limit?: number): Promise<FeedQueryResult> {
  try {
    const supabase = getPublicSupabaseClient()
    let itemsQuery = supabase
      .from('hot_items')
      .select('source_key,title,url,summary,author,published_at,position')
      .eq('section', 'technology')
      .eq('source', 'juejin')
      .order('position', { ascending: true })

    if (limit !== undefined) {
      itemsQuery = itemsQuery.limit(limit)
    }

    const [itemsResult, statusResult] = await Promise.all([
      itemsQuery,
      supabase
        .from('source_status')
        .select('source,item_count,last_success_at')
        .eq('source', 'juejin')
        .maybeSingle()
    ])

    return {
      items: itemsResult.data as HotItemRow[] | null,
      status: statusResult.data as SourceStatusRow | null,
      error: itemsResult.error?.message ?? statusResult.error?.message ?? null
    }
  } catch {
    return { items: null, status: null, error: 'Supabase is unavailable' }
  }
}

export async function getJuejinFeed(
  limit?: number,
  query: FeedQuery = queryJuejinFeed
): Promise<FeedResult> {
  const result = await query(limit)

  if (result.error) {
    return { state: 'error' }
  }

  const rows = [...(result.items ?? [])]
    .sort((left, right) => left.position - right.position)
    .slice(0, limit)

  if (rows.length === 0) {
    return { state: 'empty' }
  }

  if (!result.status) {
    return { state: 'error' }
  }

  return {
    state: 'ready',
    items: rows.map((row) => ({
      sourceKey: row.source_key,
      title: row.title,
      url: row.url,
      summary: row.summary,
      author: row.author,
      publishedAt: row.published_at ? new Date(row.published_at) : null,
      position: row.position
    })),
    status: {
      itemCount: result.status.item_count,
      lastSuccessAt: new Date(result.status.last_success_at)
    }
  }
}
