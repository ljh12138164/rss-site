import { getPublicSupabaseClient } from './supabase'
import type { NewsSourceId } from './technology-sources'

export interface SignalArticleRow {
  id: string
  source: string
  source_key: string
  title: string
  url: string
  summary: string | null
  author: string | null
  published_at: string | null
  first_seen_at: string
  last_seen_at: string
}

export interface SignalArticle {
  id: string
  source: NewsSourceId
  sourceKey: string
  title: string
  url: string
  summary: string | null
  author: string | null
  publishedAt: Date | null
  firstSeenAt: Date
  lastSeenAt: Date
}

export type NewsArticleQuery = (
  id: string,
  source: NewsSourceId
) => Promise<{ data: SignalArticleRow | null; error: string | null }>

const queryNewsArticle: NewsArticleQuery = async (id, source) => {
  try {
    const result = await getPublicSupabaseClient()
      .from('signal_articles')
      .select(
        'id,source,source_key,title,url,summary,author,published_at,first_seen_at,last_seen_at'
      )
      .eq('id', id)
      .eq('section', 'news')
      .eq('source', source)
      .maybeSingle()

    return {
      data: result.data as SignalArticleRow | null,
      error: result.error?.message ?? null
    }
  } catch {
    return { data: null, error: 'Supabase is unavailable' }
  }
}

export async function getNewsArticle(
  id: string,
  source: NewsSourceId,
  query: NewsArticleQuery = queryNewsArticle
): Promise<SignalArticle | null> {
  const result = await query(id, source)
  if (result.error) throw new Error('Unable to load news article')
  if (!result.data) return null

  return {
    id: result.data.id,
    source,
    sourceKey: result.data.source_key,
    title: result.data.title,
    url: result.data.url,
    summary: result.data.summary,
    author: result.data.author,
    publishedAt: result.data.published_at ? new Date(result.data.published_at) : null,
    firstSeenAt: new Date(result.data.first_seen_at),
    lastSeenAt: new Date(result.data.last_seen_at)
  }
}
