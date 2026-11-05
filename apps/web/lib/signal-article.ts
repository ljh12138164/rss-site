import { getSignalSource, type SignalSourceId } from '@rss-site/signals'
import { unstable_cache } from 'next/cache'
import { readArticle, readSameSource } from './business-queries'

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
  is_indexable?: boolean
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
  isIndexable?: boolean
}

export type SignalArticleQuery = (
  id: string,
  source: SignalSourceId
) => Promise<{ data: SignalArticleRow | null; error: string | null }>

export type NewsArticleQuery = SignalArticleQuery

const querySignalArticle: SignalArticleQuery = async (id, source) => {
  try {
    const signalSource = getSignalSource(source)
    return { data: await readArticle(id, signalSource.section, source), error: null }
  } catch {
    return { data: null, error: 'Business database is unavailable' }
  }
}

export async function getSignalArticle(
  id: string,
  source: SignalSourceId,
  query: SignalArticleQuery = querySignalArticle
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
    contentUpdatedAt: new Date(result.data.content_updated_at ?? result.data.last_seen_at),
    isIndexable: result.data.is_indexable === true
  }
}

export const getNewsArticle = getSignalArticle

export async function getSameSourceArticles(id: string, source: SignalSourceId) {
  const articles = await unstable_cache(
    async () => {
      return (await readSameSource(source)) as {
        id: string
        title: string
        source: SignalSourceId
      }[]
    },
    ['same-source-articles', source],
    { revalidate: 21600, tags: [`news-status:${source}`] }
  )()
  return articles.filter((article) => article.id !== id).slice(0, 4)
}
