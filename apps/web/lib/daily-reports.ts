import { unstable_cache } from 'next/cache'
import {
  type DailyReport,
  type DailySource,
  dailySections,
  isReportDate,
  reportWindow,
  safeDailyUrl,
  validateDailyDraft
} from '../../../shared/daily-report'
import { articleSource, createArticlePath } from './article-route'
import { getCachedDailyData } from './daily-report-cache'
import { getPublicSupabaseClient } from './supabase'

export type DailyArchiveEntry = { report_date: string; title: string; published_at: string }
export type DailyArchive = {
  entries: DailyArchiveEntry[]
  previousMonth?: DailyArchiveEntry
  nextMonth?: DailyArchiveEntry
  previous?: DailyArchiveEntry
  next?: DailyArchiveEntry
}
const fields =
  'report_date,title,content,sources,window_start,window_end,published_at,story_count,source_count'
const metadataFields = 'report_date,title,published_at'

export function parseDailyReport(row: Record<string, unknown>): DailyReport {
  if (
    !isReportDate(row.report_date) ||
    typeof row.title !== 'string' ||
    !Array.isArray(row.sources)
  )
    throw new Error('Invalid daily report')
  const sources: DailySource[] = row.sources.map((value: unknown) => {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new Error('Invalid daily source')
    const source = value as Record<string, unknown>
    if (
      typeof source.id !== 'string' ||
      !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(source.id) ||
      typeof source.source !== 'string' ||
      typeof source.sourceName !== 'string' ||
      typeof source.title !== 'string' ||
      !dailySections.includes(source.section as DailySource['section']) ||
      !safeDailyUrl(source.url) ||
      (source.imageUrl !== null && !safeDailyUrl(source.imageUrl)) ||
      (source.publishedAt !== null &&
        (typeof source.publishedAt !== 'string' ||
          !Number.isFinite(Date.parse(source.publishedAt)))) ||
      typeof source.firstSeenAt !== 'string' ||
      !Number.isFinite(Date.parse(source.firstSeenAt))
    )
      throw new Error('Invalid daily source')
    return source as DailySource
  })
  if (new Set(sources.map((source) => source.id)).size !== sources.length)
    throw new Error('Duplicate daily source')
  const content = validateDailyDraft(row.content, sources)
  const window = reportWindow(row.report_date)
  if (
    !content.stories.length ||
    row.title !== content.stories[0]?.title ||
    row.story_count !== content.stories.length ||
    row.source_count !== new Set(sources.map((source) => source.source)).size ||
    typeof row.published_at !== 'string' ||
    !Number.isFinite(Date.parse(row.published_at)) ||
    typeof row.window_start !== 'string' ||
    typeof row.window_end !== 'string' ||
    Date.parse(row.window_start) !== Date.parse(window.windowStart) ||
    Date.parse(row.window_end) !== Date.parse(window.windowEnd)
  )
    throw new Error('Invalid daily publication')
  return {
    reportDate: row.report_date,
    title: row.title,
    content,
    sources,
    ...window,
    publishedAt: row.published_at,
    storyCount: row.story_count,
    sourceCount: row.source_count
  }
}

export const getDailyReport = unstable_cache(
  async (date?: string): Promise<DailyReport | null> => {
    if (date !== undefined && !isReportDate(date)) return null
    return getCachedDailyData(
      `report:${date ?? 'latest'}`,
      (value) => {
        if (value === null) return null
        if (!value || typeof value !== 'object' || Array.isArray(value))
          throw new Error('Invalid daily report')
        const report = parseDailyReport(value as Record<string, unknown>)
        if (date && report.reportDate !== date) throw new Error('Invalid daily report date')
        return report
      },
      async () => {
        let query = getPublicSupabaseClient().from('daily_reports').select(fields)
        if (date) query = query.eq('report_date', date)
        const { data, error } = await query
          .order('report_date', { ascending: false })
          .limit(1)
          .abortSignal(AbortSignal.timeout(10_000))
        if (error) throw new Error('Daily reports unavailable')
        return data?.[0] ?? null
      }
    )
  },
  ['daily-report-v1'],
  { revalidate: 300, tags: ['daily-reports'] }
)

export const getDailyArchive = unstable_cache(
  async (date: string): Promise<DailyArchive> => {
    if (!isReportDate(date)) throw new Error('Invalid report date')
    return getCachedDailyData(`archive:${date}`, parseDailyArchive, async () => {
      const start = `${date.slice(0, 7)}-01`
      const next = new Date(`${start}T00:00:00Z`)
      next.setUTCMonth(next.getUTCMonth() + 1)
      const end = next.toISOString().slice(0, 10)
      const client = getPublicSupabaseClient()
      const queries = [
        client
          .from('daily_reports')
          .select(metadataFields)
          .gte('report_date', start)
          .lt('report_date', end)
          .order('report_date', { ascending: false })
          .limit(31),
        client
          .from('daily_reports')
          .select(metadataFields)
          .lt('report_date', start)
          .order('report_date', { ascending: false })
          .limit(1),
        client
          .from('daily_reports')
          .select(metadataFields)
          .gte('report_date', end)
          .order('report_date')
          .limit(1),
        client
          .from('daily_reports')
          .select(metadataFields)
          .lt('report_date', date)
          .order('report_date', { ascending: false })
          .limit(1),
        client
          .from('daily_reports')
          .select(metadataFields)
          .gt('report_date', date)
          .order('report_date')
          .limit(1)
      ]
      const results = await Promise.all(
        queries.map((query) => query.abortSignal(AbortSignal.timeout(10_000)))
      )
      if (results.some((result) => result.error)) throw new Error('Daily archive unavailable')
      return {
        entries: (results[0]?.data ?? []) as DailyArchiveEntry[],
        previousMonth: results[1]?.data?.[0] as DailyArchiveEntry | undefined,
        nextMonth: results[2]?.data?.[0] as DailyArchiveEntry | undefined,
        previous: results[3]?.data?.[0] as DailyArchiveEntry | undefined,
        next: results[4]?.data?.[0] as DailyArchiveEntry | undefined
      }
    })
  },
  ['daily-archive-v1'],
  { revalidate: 300, tags: ['daily-reports'] }
)

export const getDailyArticleLinks = unstable_cache(
  async (sources: DailySource[]) => {
    if (!sources.length) return {}
    const { data, error } = await getPublicSupabaseClient()
      .from('signal_articles')
      .select('id')
      .in(
        'id',
        sources.map((source) => source.id)
      )
      .abortSignal(AbortSignal.timeout(10_000))
    if (error) throw new Error('Daily citations unavailable')
    const existing = new Set((data ?? []).map((row) => row.id as string))
    return Object.fromEntries(
      sources
        .filter(
          (source) => existing.has(source.id) && articleSource(source.source)?.source.isArticle
        )
        .map((source) => [source.id, createArticlePath(source.source, source.title, source.id)])
    )
  },
  ['daily-article-links-v1'],
  { revalidate: 300, tags: ['daily-reports'] }
)

function parseDailyArchive(value: unknown): DailyArchive {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid daily archive')
  const archive = value as DailyArchive
  const validEntry = (entry: DailyArchiveEntry) =>
    entry &&
    isReportDate(entry.report_date) &&
    typeof entry.title === 'string' &&
    typeof entry.published_at === 'string' &&
    Number.isFinite(Date.parse(entry.published_at))
  if (
    !Array.isArray(archive.entries) ||
    archive.entries.length > 31 ||
    !archive.entries.every(validEntry) ||
    [archive.previousMonth, archive.nextMonth, archive.previous, archive.next].some(
      (entry) => entry !== undefined && !validEntry(entry)
    )
  )
    throw new Error('Invalid daily archive')
  return archive
}
