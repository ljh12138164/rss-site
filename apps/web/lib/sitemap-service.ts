import {
  aiSources,
  financeSources,
  gameSources,
  newsSources,
  socialSources,
  technologyArticleSources
} from '@rss-site/signals'
import { sql } from 'drizzle-orm'
import { unstable_cache } from 'next/cache'
import { isReportDate } from '../../../shared/daily-report'
import { skillPath } from '../../../shared/skills'
import { createArticlePath } from './article-route'
import { readBusinessRows } from './business-db'
import { siteUrl } from './site-url'

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
  const [row] = await readBusinessRows<{ count: number }>(sql`select count(*)::integer as count
    from signal_articles where is_indexable=true and source in (
      ${sql.join(
        readerSources.map((id) => sql`${id}`),
        sql`, `
      )}
    )`)
  return row.count
}

export function getBaseEntries(): SitemapEntry[] {
  const entries: SitemapEntry[] = [
    { url: siteUrl('/') },
    { url: siteUrl('/latest') },
    { url: siteUrl('/daily') },
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
    const data: { id: string; slug: string; updated_at: string }[] = await readBusinessRows(sql`
      select id,slug,updated_at from ai_events where status='published'
      ${afterEventId ? sql`and id>${afterEventId}::uuid` : sql``} order by id limit 1000`)
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
      const data = await readBusinessRows<{
        id: string
        source: string
        title: string
        published_at: string | null
        last_seen_at: string
        content_updated_at: string | null
      }>(sql`select id,source,title,published_at,last_seen_at,content_updated_at
        from signal_articles where is_indexable=true and source in (
          ${sql.join(
            readerSources.map((id) => sql`${id}`),
            sql`, `
          )})
        order by published_at desc nulls last,id desc limit ${end - start + 1} offset ${start}`)
      return (data ?? []).map((article) => ({
        url: siteUrl(createArticlePath(article.source, article.title, article.id)),
        lastModified: article.content_updated_at ?? article.published_at ?? article.last_seen_at
      }))
    })
  )
  return batches.flat()
}

export async function getSkillEntries(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = []
  let afterId: string | null = null
  for (;;) {
    const data: { skill_id: string; content_synced_at: string | null }[] =
      await readBusinessRows(sql`
      select skill_id,content_synced_at from skill_details where skill_markdown is not null
      ${afterId ? sql`and skill_id>${afterId}` : sql``} order by skill_id limit 1000`)
    if (!data?.length) break
    for (const skill of data) {
      const path = skillPath(skill.skill_id)
      if (path)
        entries.push({ url: siteUrl(path), lastModified: skill.content_synced_at ?? undefined })
    }
    if (data.length < 1000) break
    afterId = data[data.length - 1].skill_id
  }
  return entries
}

export async function getDailyReportEntries(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = []
  let after: string | undefined
  for (;;) {
    const data = await readBusinessRows<{ report_date: string; published_at: string }>(sql`
      select report_date,published_at from daily_reports
      ${after ? sql`where report_date>${after}::date` : sql``} order by report_date limit 1000`)
    if (!data?.length) break
    for (const report of data) {
      if (!isReportDate(report.report_date)) throw new Error('Invalid sitemap report date')
      entries.push({
        url: siteUrl(`/daily/${report.report_date}`),
        lastModified: report.published_at
      })
    }
    if (data.length < 1000) break
    after = data[data.length - 1].report_date
  }
  return entries
}

const getSitemapCatalog = unstable_cache(
  async (_origin: string) => {
    const [events, skills, dailyReports, articleCount] = await Promise.all([
      getAiEventEntries(),
      getSkillEntries(),
      getDailyReportEntries(),
      getSignalArticlesCount()
    ])
    const entries = [...getBaseEntries(), ...events, ...skills, ...dailyReports]
    return { entries, total: entries.length + articleCount }
  },
  ['sitemap-catalog-v4'],
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
  ['sitemap-xml-v4'],
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
