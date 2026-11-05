import { PgDialect } from 'drizzle-orm/pg-core'
import { beforeEach, expect, it, vi } from 'vitest'
import { getContentStatus, getDailyReportStatus } from './content-status'

const { read, dailyReport } = vi.hoisted(() => ({ read: vi.fn(), dailyReport: vi.fn() }))
vi.mock('./business-db', () => ({ readBusinessRows: read }))
vi.mock('./daily-reports', () => ({ getDailyReport: dailyReport }))
vi.mock('next/cache', () => ({ unstable_cache: (fn: () => unknown) => fn }))
beforeEach(() => vi.resetAllMocks())
it('shares the daily report read and propagates failures', async () => {
  dailyReport
    .mockResolvedValueOnce({})
    .mockResolvedValueOnce(null)
    .mockRejectedValueOnce(new Error('unavailable'))
  expect(await getDailyReportStatus('2026-11-04')).toBe(200)
  expect(await getDailyReportStatus('2026-11-03')).toBe(404)
  await expect(getDailyReportStatus('2026-11-02')).rejects.toThrow('unavailable')
})
it('reads visibility and tombstones in one snapshot, with tombstone precedence', async () => {
  read
    .mockResolvedValueOnce([{ removed: false, visible: true }])
    .mockResolvedValueOnce([{ removed: true, visible: true }])
  expect(await getContentStatus('news', '550e8400-e29b-41d4-a716-446655440000', 'juejin')).toBe(200)
  const query = new PgDialect().sqlToQuery(read.mock.calls[0][0])
  expect(query.sql).toContain('content_tombstones')
  expect(query.sql).toContain('signal_articles')
  expect(read).toHaveBeenCalledTimes(1)
  expect(await getContentStatus('news', '550e8400-e29b-41d4-a716-446655440000', 'juejin')).toBe(410)
})
it('returns 404 for absence and never turns database failure into a 404', async () => {
  read
    .mockResolvedValueOnce([{ removed: false, visible: false }])
    .mockRejectedValueOnce(new Error('offline'))
  expect(await getContentStatus('event', 'missing-event', 'events')).toBe(404)
  await expect(getContentStatus('event', 'missing-event', 'events')).rejects.toThrow()
})
it('requires event publication', async () => {
  read.mockResolvedValue([{ removed: false, visible: true }])
  expect(await getContentStatus('event', 'published-event', 'events')).toBe(200)
  expect(new PgDialect().sqlToQuery(read.mock.calls[0][0]).sql).toContain("status='published'")
})
