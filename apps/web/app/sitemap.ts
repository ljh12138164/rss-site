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

const MAX_SITEMAP_ENTRIES = 50000

export const revalidate = 7200

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: siteUrl('/') },
    { url: siteUrl('/about') },
    { url: siteUrl('/privacy') },
    { url: siteUrl('/ai/events') },
    { url: siteUrl('/github') }
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
    for (const source of sources) entries.push({ url: siteUrl(`/${section}/${source.id}`) })
  }

  // Gracefully fetch published AI events up to the sitemap limit
  let afterEventId: string | null = null
  for (;;) {
    if (entries.length >= MAX_SITEMAP_ENTRIES) break
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
        if (entries.length >= MAX_SITEMAP_ENTRIES) break
      }
      if (entries.length >= MAX_SITEMAP_ENTRIES || data.length < 1000) break
      afterEventId = data[data.length - 1].id
    } catch (err) {
      console.warn('[sitemap] Unexpected error querying ai_events:', err)
      break
    }
  }

  // Gracefully fetch the freshest signal articles across all platforms
  let offset = 0
  for (;;) {
    if (entries.length >= MAX_SITEMAP_ENTRIES) break
    const batchLimit = Math.min(1000, MAX_SITEMAP_ENTRIES - entries.length)
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
        if (entries.length >= MAX_SITEMAP_ENTRIES) break
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
