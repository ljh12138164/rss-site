import { articleSource } from './article-route'
import { getPublicSupabaseClient } from './supabase'
import type { SignalSourceId } from './technology-sources'

export interface SignalArticleRow {
  id: string
  source: string
  source_key: string
  title: string
  url: string
  summary: string | null
  content_html?: string | null
  author: string | null
  published_at: string | null
  first_seen_at: string
  last_seen_at: string
  content_updated_at?: string | null
}

export interface SignalArticle {
  id: string
  source: SignalSourceId
  sourceKey: string
  title: string
  url: string
  summary: string | null
  contentHtml?: string | null
  author: string | null
  publishedAt: Date | null
  firstSeenAt: Date
  lastSeenAt: Date
  contentUpdatedAt?: Date
}

export type NewsArticleQuery = (
  id: string,
  source: SignalSourceId
) => Promise<{ data: SignalArticleRow | null; error: string | null }>

const queryNewsArticle: NewsArticleQuery = async (id, source) => {
  try {
    const result = await getPublicSupabaseClient()
      .from('signal_articles')
      .select('*')
      .eq('id', id)
      .eq('section', articleSource(source)?.section.id ?? '')
      .eq('source', source)
      .abortSignal(AbortSignal.timeout(10000))
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
  source: SignalSourceId,
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
    ...(result.data.content_html ? { contentHtml: result.data.content_html } : {}),
    author: result.data.author,
    publishedAt: result.data.published_at ? new Date(result.data.published_at) : null,
    firstSeenAt: new Date(result.data.first_seen_at),
    lastSeenAt: new Date(result.data.last_seen_at),
    contentUpdatedAt: new Date(result.data.content_updated_at ?? result.data.last_seen_at)
  }
}
