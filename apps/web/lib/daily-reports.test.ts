import { readFileSync } from 'node:fs'
import { PgDialect } from 'drizzle-orm/pg-core'
import { describe, expect, it, vi } from 'vitest'
import { getCachedDailyData } from './daily-report-cache'
import { getDailyArchive, getDailyReport, parseDailyReport } from './daily-reports'

const fixture = JSON.parse(
  readFileSync(new URL('../../../shared/daily-report.fixture.json', import.meta.url), 'utf8')
)
const { request, result } = vi.hoisted(() => ({
  request: vi.fn(),
  result: { data: [] as unknown[], error: null as unknown }
}))
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }))
vi.mock('./daily-report-cache', () => ({
  getCachedDailyData: vi.fn(
    async (_key: string, parse: (value: unknown) => unknown, load: () => Promise<unknown>) =>
      parse(await load())
  )
}))
vi.mock('./business-db', () => ({
  readBusinessRows: async (statement: Parameters<PgDialect['sqlToQuery']>[0]) => {
    request(new PgDialect().sqlToQuery(statement))
    if (result.error) throw new Error('Daily reports unavailable')
    return result.data
  }
}))

const row = () => ({
  report_date: '2026-11-04',
  title: fixture.draft.stories[0].title,
  content: structuredClone(fixture.draft),
  sources: structuredClone(fixture.sources),
  window_start: '2026-11-02T16:00:00Z',
  window_end: '2026-11-03T16:00:00Z',
  published_at: '2026-11-04T00:05:00Z',
  story_count: 1,
  source_count: 1
})

describe('public daily report reads', () => {
  it('rejects unsafe citation URLs, fabricated counts and unknown references', () => {
    const unsafe = row()
    unsafe.sources[0].url = 'javascript:alert(1)'
    expect(() => parseDailyReport(unsafe)).toThrow()
    expect(() => parseDailyReport({ ...row(), story_count: 9 })).toThrow()
    const invalid = row()
    invalid.content.stories[0].sourceIds = ['invented']
    expect(() => parseDailyReport(invalid)).toThrow()
  })
  it('distinguishes an empty archive from a failed read', async () => {
    result.data = []
    result.error = null
    expect(await getDailyReport()).toBeNull()
    result.error = { message: 'synthetic database failure' }
    await expect(getDailyReport()).rejects.toThrow('Daily reports unavailable')
    result.error = null
  })
  it('bounds archives to a calendar month and reads only metadata', async () => {
    request.mockClear()
    result.data = []
    result.error = null
    await getDailyArchive('2026-12-31')
    expect(getCachedDailyData).toHaveBeenLastCalledWith(
      'archive:2026-12-31',
      expect.any(Function),
      expect.any(Function)
    )
    expect(request.mock.calls[0][0].params).toEqual(['2026-12-01', '2027-01-01'])
    for (const [query] of request.mock.calls) {
      expect(query.sql).toMatch(/select report_date,title,published_at/)
      expect(query.sql).not.toContain('content,')
    }
  })
})
