import type { MetadataRoute } from 'next'
import { createArticlePath } from '../lib/article-route'
import { siteUrl } from '../lib/site-url'
import { getPublicSupabaseClient } from '../lib/supabase'
import {
  aiSources,
  financeSources,
  gameSources,
  newsSources,
  socialSources,
  technologyArticleSources
} from '../lib/technology-sources'

const SITEMAP_CHUNK_SIZE = 40000

export const revalidate = 7200

export async function generateSitemaps(): Promise<Array<{ id: number }>> {
  try {
    const client = getPublicSupabaseClient()
    const { count, error } = await client
      .from('signal_articles')
      .select('*', { count: 'exact', head: true })

    if (error || typeof count !== 'number' || count <= 0) {
      return [{ id: 0 }]
    }

    const totalPages = Math.max(1, Math.ceil(count / SITEMAP_CHUNK_SIZE))
    return Array.from({ length: totalPages }, (_, index) => ({ id: index }))
  } catch (err) {
    console.warn('[sitemap] Failed to generate sitemaps chunk index:', err)
    return [{ id: 0 }]
  }
}

export type SitemapProps = {
  id?: Promise<string | number | undefined> | string | number | undefined
}

export default async function sitemap(
  props?: SitemapProps | Promise<SitemapProps>
): Promise<MetadataRoute.Sitemap> {
  const resolvedProps = props instanceof Promise ? await props : props
  let rawId = resolvedProps?.id
  if (rawId instanceof Promise) {
    rawId = await rawId
  }
  const pageIndex =
    typeof rawId === 'number'
      ? rawId
      : rawId
        ? Number.parseInt(String(rawId), 10)
        : 0
  const currentPage = Number.isNaN(pageIndex) || pageIndex < 0 ? 0 : pageIndex

  const entries: MetadataRoute.Sitemap = []

  // Chunk 0 contains static base routes and all published AI events
  if (currentPage === 0) {
    entries.push(
      { url: siteUrl('/') },
      { url: siteUrl('/about') },
      { url: siteUrl('/privacy') },
      { url: siteUrl('/ai/events') },
      { url: siteUrl('/github') }
    )

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
      for (const source of sources) entries.push({ url: siteUrl(`/${section}/${source.id}`) })
    }

    // Gracefully fetch published AI events
    let afterEventId: string | null = null
    for (;;) {
      if (entries.length >= SITEMAP_CHUNK_SIZE) break
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
          entries.push({ url: siteUrl(`/ai/events/${event.slug}`), lastModified: event.updated_at })
        }
        if (entries.length >= SITEMAP_CHUNK_SIZE || data.length < 1000) break
        afterEventId = data[data.length - 1].id
      } catch (err) {
        console.warn('[sitemap] Unexpected error querying ai_events:', err)
        break
      }
    }
  }

  // Fetch signal articles corresponding to this chunk
  let offset = currentPage * SITEMAP_CHUNK_SIZE
  const maxChunkEnd = (currentPage + 1) * SITEMAP_CHUNK_SIZE

  for (;;) {
    if (entries.length >= SITEMAP_CHUNK_SIZE) break
    const batchLimit = Math.min(1000, maxChunkEnd - offset)
    if (batchLimit <= 0) break

    try {
      const { data, error } = await getPublicSupabaseClient()
        .from('signal_articles')
        .select('id,source,title,published_at,last_seen_at')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false })
        .range(offset, offset + batchLimit - 1)

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
            lastModified: article.published_at ?? article.last_seen_at
          })
        } catch {
          continue
        }
        if (entries.length >= SITEMAP_CHUNK_SIZE) break
      }

      if (data.length < batchLimit) break
      offset += data.length
    } catch (err) {
      console.warn('[sitemap] Unexpected error querying signal_articles:', err)
      break
    }
  }

  return entries
}
