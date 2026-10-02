import { listSignalSources } from '@rss-site/signals'

export interface IngestionHealth {
  source: string
  last_success_at: string | null
  last_item_count: number
  last_run_at: string | null
  last_run_status: string | null
  consecutive_failures: number
  sample_count: number
  body_count: number
}

export function ingestionHealthState(
  row: IngestionHealth,
  now = Date.now()
): '未采集' | '采集中' | '连续失败' | '更新延迟' | '正常' {
  if (row.consecutive_failures > 0 && row.last_run_status !== 'running') return '连续失败'
  const source = listSignalSources().find((entry) => entry.id === row.source)
  const interval = source?.section === 'ai' ? 2 : 6
  if (row.last_run_status === 'running') {
    return row.last_run_at && now - Date.parse(row.last_run_at) > interval * 3600000
      ? '更新延迟'
      : '采集中'
  }
  if (!row.last_success_at) return '未采集'
  return now - Date.parse(row.last_success_at) > interval * 2 * 3600000 ? '更新延迟' : '正常'
}
