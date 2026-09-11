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
  let afterEventId: string | null = null
  for (;;) {
    let query = getPublicSupabaseClient()
      .from('ai_events')
      .select('id,slug,updated_at')
      .eq('status', 'published')
      .order('id')
      .limit(1000)
    if (afterEventId) query = query.gt('id', afterEventId)
    const { data, error } = await query
    if (error) throw new Error('Unable to generate sitemap')
    for (const event of data)
      entries.push({ url: siteUrl(`/ai/events/${event.slug}`), lastModified: event.updated_at })
    if (entries.length >= 50000) break
    if (data.length < 1000) break
    afterEventId = data[data.length - 1].id
  }

  let afterArticleId: string | null = null
  for (;;) {
    if (entries.length >= 50000) break
    let query = getPublicSupabaseClient()
      .from('signal_articles')
      .select('id,source,title,published_at,last_seen_at')
      .order('id')
      .limit(1000)
    if (afterArticleId) query = query.gt('id', afterArticleId)
    const { data, error } = await query
    if (error) throw new Error('Unable to generate sitemap')
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
      if (entries.length >= 50000) break
    }
    if (data.length < 1000) break
    afterArticleId = data[data.length - 1].id
  }

  return entries
}
