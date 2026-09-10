import type { MetadataRoute } from 'next'
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
  // Thin third-party news summaries are noindex and deliberately omitted.
  let after: string | null = null
  for (;;) {
    let query = getPublicSupabaseClient()
      .from('ai_events')
      .select('id,slug,updated_at')
      .eq('status', 'published')
      .order('id')
      .limit(1000)
    if (after) query = query.gt('id', after)
    const { data, error } = await query
    if (error) throw new Error('Unable to generate sitemap')
    for (const event of data)
      entries.push({ url: siteUrl(`/ai/events/${event.slug}`), lastModified: event.updated_at })
    if (entries.length > 50000)
      throw new Error('Sitemap requires splitting before publishing more URLs')
    if (data.length < 1000) break
    after = data[data.length - 1].id
  }
  return entries
}
