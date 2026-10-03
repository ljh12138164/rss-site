import { expect, it } from 'vitest'
import { type IngestionHealth, ingestionHealthState } from './ingestion-health'

const row: IngestionHealth = {
  source: 'openai',
  last_success_at: '2026-10-02T00:00:00Z',
  last_item_count: 10,
  last_run_at: '2026-10-02T00:00:00Z',
  last_run_status: 'succeeded',
  consecutive_failures: 0,
  sample_count: 100,
  body_count: 80
}

it('distinguishes uncollected, failing, stale, running and healthy sources', () => {
  const now = Date.parse('2026-10-02T02:00:00Z')
  expect(ingestionHealthState(row, now)).toBe('正常')
  expect(ingestionHealthState({ ...row, last_success_at: null }, now)).toBe('未采集')
  expect(
    ingestionHealthState({ ...row, last_run_status: 'failed', consecutive_failures: 2 }, now)
  ).toBe('连续失败')
  expect(ingestionHealthState(row, now + 3 * 3600000)).toBe('更新延迟')
  expect(
    ingestionHealthState(
      { ...row, last_run_status: 'running', last_run_at: '2026-10-02T01:59:00Z' },
      now
    )
  ).toBe('采集中')
  expect(ingestionHealthState({ ...row, last_run_status: 'running' }, now + 3600000)).toBe(
    '更新延迟'
  )
})
