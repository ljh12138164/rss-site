import { createArticlePath } from './article-route'
import { siteUrl } from './site-url'
import { getPublicSupabaseClient } from './supabase'
import {
  aiSources,
  financeSources,
  gameSources,
  newsSources,
  socialSources,
  technologyArticleSources
} from './technology-sources'

export const SITEMAP_CHUNK_SIZE = 5000
export const SITEMAP_CACHE_CONTROL =
  'public, max-age=0, s-maxage=7200, stale-while-revalidate=86400'

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
  try {
    const client = getPublicSupabaseClient()
    const { count, error } = await client
      .from('signal_articles')
      .select('*', { count: 'exact', head: true })

    if (error || typeof count !== 'number' || count < 0) {
      return 0
    }
    return count
  } catch (err) {
    console.warn('[sitemap] Failed to get signal articles count:', err)
    return 0
  }
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
    try {
      let query = getPublicSupabaseClient()
        .from('ai_events')
        .select('id,slug,updated_at')
        .eq('status', 'published')
        .order('id')
        .limit(1000)

      if (afterEventId) query = query.gt('id', afterEventId)
      const { data, error } = await query

      if (error) {
        console.warn('[sitemap] Failed to fetch events from Supabase:', error.message)
        break
      }
      if (!data || data.length === 0) break

      for (const event of data) {
        entries.push({
          url: siteUrl(`/ai/events/${event.slug}`),
          lastModified: event.updated_at
        })
      }

      if (data.length < 1000) break
      afterEventId = data[data.length - 1].id
    } catch (err) {
      console.warn('[sitemap] Unexpected error querying ai_events:', err)
      break
    }
  }

  return entries
}

export async function getArticleEntries(offset: number, limit: number): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = []
  let currentOffset = offset
  const maxEnd = offset + limit

  for (;;) {
    const batchLimit = Math.min(1000, maxEnd - currentOffset)
    if (batchLimit <= 0) break

    try {
      const { data, error } = await getPublicSupabaseClient()
        .from('signal_articles')
        .select('id,source,title,published_at,last_seen_at,content_updated_at')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false })
        .range(currentOffset, currentOffset + batchLimit - 1)

      if (error) {
        console.warn('[sitemap] Failed to fetch articles from Supabase:', error.message)
        break
      }
      if (!data || data.length === 0) break

      for (const article of data) {
        try {
          const path = createArticlePath(article.source, article.title, article.id)
          entries.push({
            url: siteUrl(path),
            lastModified: article.content_updated_at ?? article.published_at ?? article.last_seen_at
          })
        } catch {}
      }

      if (data.length < batchLimit) break
      currentOffset += data.length
    } catch (err) {
      console.warn('[sitemap] Unexpected error querying signal_articles:', err)
      break
    }
  }

  return entries
}

export async function getChunkSitemapEntries(chunkIndex: number): Promise<SitemapEntry[]> {
  if (chunkIndex === 0) {
    const base = getBaseEntries()
    const events = await getAiEventEntries()
    const articles = await getArticleEntries(0, SITEMAP_CHUNK_SIZE)
    return [...base, ...events, ...articles]
  }

  return getArticleEntries(chunkIndex * SITEMAP_CHUNK_SIZE, SITEMAP_CHUNK_SIZE)
}

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
