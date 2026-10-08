import { listSignalSources } from '@rss-site/signals'
import { expect, it } from 'vitest'
import type { IngestionHealth } from './ingestion-health'
import { ingestionOverview } from './ingestion-overview'

const now = Date.parse('2026-10-02T02:00:00Z')
const row: IngestionHealth = {
  source: 'openai',
  last_success_at: '2026-10-02T01:00:00Z',
  last_item_count: 10,
  last_run_at: '2026-10-02T01:00:00Z',
  last_run_status: 'succeeded',
  consecutive_failures: 0,
  sample_count: 100,
  body_count: 80
}

it('uses filtered registered sources and weighted article samples for summary', () => {
  const overview = ingestionOverview(
    [
      row,
      { ...row, source: 'anthropic', sample_count: 10, body_count: 0 },
      { ...row, source: 'github', sample_count: 100, body_count: 100 },
      { ...row, source: 'unknown', last_success_at: '2026-10-02T02:00:00Z' }
    ],
    'ai',
    now
  )
  expect(overview.summary).toMatchObject({
    healthy: 2,
    attention: 0,
    running: 0,
    uncollected: listSignalSources({ section: 'ai' }).length - 2,
    total: listSignalSources({ section: 'ai' }).length,
    latestSuccess: '2026-10-02T01:00:00Z',
    sampleCount: 110,
    bodyCount: 80,
    bodyCoverage: 73
  })
  expect(overview.rows.every(({ source }) => source.section === 'ai')).toBe(true)
  expect(
    ingestionOverview(
      [row, { ...row, source: 'github', sample_count: 100, body_count: 100 }],
      '',
      now
    ).summary?.bodyCoverage
  ).toBe(80)
  expect(ingestionOverview([row], 'skills', now).summary?.bodyCoverage).toBeNull()
})

it('counts failures and delays as attention while separating running and uncollected', () => {
  const { summary, rows } = ingestionOverview(
    [
      { ...row, last_run_status: 'failed', consecutive_failures: 2 },
      { ...row, source: 'anthropic', last_success_at: '2026-10-01T00:00:00Z' },
      { ...row, source: 'deepseek', last_run_status: 'running' },
      { ...row, source: 'glm', last_success_at: '2026-10-02T01:30:00Z' }
    ],
    'ai',
    now
  )
  expect(summary?.attention).toBe(2)
  expect(summary?.running).toBe(1)
  expect(summary?.healthy).toBe(1)
  expect(summary?.latestSuccess).toBe('2026-10-02T01:30:00Z')
  expect(summary?.uncollected).toBe((summary?.total ?? 0) - 4)
  expect(rows.find(({ source }) => source.id === 'openai')?.state).toBe('连续失败')
})

it('represents unavailable data without fabricated counts', () => {
  expect(ingestionOverview(undefined, '', now)).toEqual({ rows: [], summary: null })
  const { summary } = ingestionOverview([], 'ai', now)
  expect(summary?.healthy).toBe(0)
  expect(summary?.latestSuccess).toBeNull()
  expect(summary?.bodyCoverage).toBeNull()
  expect(summary?.uncollected).toBe(summary?.total)
})
