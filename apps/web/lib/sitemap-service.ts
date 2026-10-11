import {
  aiSources,
  financeSources,
  gameSources,
  newsSources,
  socialSources,
  technologyArticleSources
} from '@rss-site/signals'
import { unstable_cache } from 'next/cache'
import { createArticlePath } from './article-route'
import { siteUrl } from './site-url'
import { getPublicSupabaseClient } from './supabase'

// Keep cached XML documents below Next's 2 MB data-cache limit.
export const SITEMAP_CHUNK_SIZE = 2000
export const SITEMAP_CACHE_CONTROL =
  'public, max-age=0, s-maxage=7200, stale-while-revalidate=86400'
const readerSources = [
  ...aiSources,
  ...financeSources,
  ...gameSources,
  ...newsSources,
  ...socialSources,
  ...technologyArticleSources
]
  .filter((source) => source.isArticle)
  .map((source) => source.id)

export type SitemapEntry = {
  url: string
  lastModified?: string
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function getSignalArticlesCount(): Promise<number> {
  const { count, error } = await getPublicSupabaseClient()
    .from('signal_articles')
    .select('*', { count: 'exact', head: true })
    .eq('is_indexable', true)
    .in('source', readerSources)
    .abortSignal(AbortSignal.timeout(10000))
  if (error || typeof count !== 'number' || count < 0) throw new Error('Sitemap count unavailable')
  return count
}

export function getBaseEntries(): SitemapEntry[] {
  const entries: SitemapEntry[] = [
    { url: siteUrl('/') },
    { url: siteUrl('/about') },
    { url: siteUrl('/privacy') },
    { url: siteUrl('/ai/events') },
    { url: siteUrl('/github') },
    { url: siteUrl('/skills') },
    { url: siteUrl('/mcp') }
  ]

  const sections = [
    ['ai', aiSources],
    ['technology', technologyArticleSources],
    ['news', newsSources],
    ['social', socialSources],
    ['finance', financeSources],
    ['games', gameSources]
  ] as const

  for (const [section, sources] of sections) {
    entries.push({ url: siteUrl(`/${section}`) })
    for (const source of sources) {
      entries.push({ url: siteUrl(`/${section}/${source.id}`) })
    }
  }

  return entries
}

export async function getAiEventEntries(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = []
  let afterEventId: string | null = null

  for (;;) {
    let query = getPublicSupabaseClient()
      .from('ai_events')
      .select('id,slug,updated_at')
      .eq('status', 'published')
      .order('id')
      .limit(1000)

    if (afterEventId) query = query.gt('id', afterEventId)
    const { data, error } = await query.abortSignal(AbortSignal.timeout(10000))
    if (error) throw new Error('Sitemap events unavailable')
    if (!data || data.length === 0) break

    for (const event of data) {
      entries.push({
        url: siteUrl(`/ai/events/${event.slug}`),
        lastModified: event.updated_at
      })
    }

    if (data.length < 1000) break
    afterEventId = data[data.length - 1].id
  }

  return entries
}

export async function getArticleEntries(offset: number, limit: number): Promise<SitemapEntry[]> {
  const batches = await Promise.all(
    Array.from({ length: Math.ceil(limit / 1000) }, async (_, index) => {
      const start = offset + index * 1000
      const end = Math.min(start + 999, offset + limit - 1)
      const { data, error } = await getPublicSupabaseClient()
        .from('signal_articles')
        .select('id,source,title,published_at,last_seen_at,content_updated_at')
        .eq('is_indexable', true)
        .in('source', readerSources)
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false })
        .range(start, end)
        .abortSignal(AbortSignal.timeout(10000))
      if (error) throw new Error('Sitemap articles unavailable')
      return (data ?? []).map((article) => ({
        url: siteUrl(createArticlePath(article.source, article.title, article.id)),
        lastModified: article.content_updated_at ?? article.published_at ?? article.last_seen_at
      }))
    })
  )
  return batches.flat()
}

const getSitemapCatalog = unstable_cache(
  async (_origin: string) => {
    const [events, articleCount] = await Promise.all([
      getAiEventEntries(),
      getSignalArticlesCount()
    ])
    const entries = [...getBaseEntries(), ...events]
    return { entries, total: entries.length + articleCount }
  },
  ['sitemap-catalog-v2'],
  { revalidate: 7200, tags: ['sitemap'] }
)

export async function getChunkSitemapEntries(chunkIndex: number): Promise<SitemapEntry[]> {
  const { entries } = await getSitemapCatalog(siteUrl('/'))
  const start = chunkIndex * SITEMAP_CHUNK_SIZE
  const catalog = entries.slice(start, start + SITEMAP_CHUNK_SIZE)
  const articles = await getArticleEntries(
    Math.max(0, start - entries.length),
    SITEMAP_CHUNK_SIZE - catalog.length
  )
  return [...catalog, ...articles]
}

export const getSitemapXml = unstable_cache(
  async (_origin: string, chunk: number | null) => {
    const { total } = await getSitemapCatalog(siteUrl('/'))
    const chunks = Math.max(1, Math.ceil(total / SITEMAP_CHUNK_SIZE))
    if (chunk !== null && chunk >= chunks) return null
    if (chunk === null && chunks > 1) return renderSitemapIndexXml(chunks)
    return renderUrlSetXml(await getChunkSitemapEntries(chunk ?? 0))
  },
  ['sitemap-xml-v2'],
  { revalidate: 7200, tags: ['sitemap'] }
)

export function renderUrlSetXml(entries: SitemapEntry[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

  for (const entry of entries) {
    xml += '  <url>\n'
    xml += `    <loc>${escapeXml(entry.url)}</loc>\n`
    if (entry.lastModified) {
      xml += `    <lastmod>${escapeXml(entry.lastModified)}</lastmod>\n`
    }
    xml += '  </url>\n'
  }

  xml += '</urlset>'
  return xml
}

export function renderSitemapIndexXml(chunkCount: number): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

  for (let i = 0; i < chunkCount; i++) {
    xml += '  <sitemap>\n'
    xml += `    <loc>${escapeXml(siteUrl(`/sitemap/${i}.xml`))}</loc>\n`
    xml += '  </sitemap>\n'
  }

  xml += '</sitemapindex>'
  return xml
}
