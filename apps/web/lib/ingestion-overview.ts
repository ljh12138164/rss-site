import { listSignalSources } from '@rss-site/signals'
import { type IngestionHealth, ingestionHealthState } from './ingestion-health'

export function ingestionOverview(
  data: IngestionHealth[] | undefined,
  section = '',
  now = Date.now()
) {
  const rows = data
    ? listSignalSources()
        .filter((source) => !section || source.section === section)
        .map((source) => {
          const row: IngestionHealth = data.find((entry) => entry.source === source.id) ?? {
            source: source.id,
            last_success_at: null,
            last_item_count: 0,
            last_run_at: null,
            last_run_status: null,
            consecutive_failures: 0,
            sample_count: 0,
            body_count: 0
          }
          return { source, row, state: ingestionHealthState(row, now) }
        })
    : []
  if (!data) return { rows, summary: null }
  let latestSuccess: string | null = null
  let sampleCount = 0
  let bodyCount = 0
  for (const { source, row } of rows) {
    if (
      row.last_success_at &&
      (!latestSuccess || Date.parse(row.last_success_at) > Date.parse(latestSuccess))
    ) {
      latestSuccess = row.last_success_at
    }
    if (source.isArticle && row.sample_count > 0) {
      sampleCount += row.sample_count
      bodyCount += row.body_count
    }
  }
  return {
    rows,
    summary: {
      total: rows.length,
      healthy: rows.filter(({ state }) => state === '正常').length,
      attention: rows.filter(({ state }) => state === '连续失败' || state === '更新延迟').length,
      running: rows.filter(({ state }) => state === '采集中').length,
      uncollected: rows.filter(({ state }) => state === '未采集').length,
      latestSuccess,
      sampleCount,
      bodyCount,
      bodyCoverage: sampleCount ? Math.round((bodyCount / sampleCount) * 100) : null
    }
  }
}
