export const ARTICLE_SUMMARY_VERSION = 'cloudflare-qwen3-30b-a3b-fp8-zh-v2'

export interface SummaryResult {
  overview: string
  keyPoints: string[]
}

export interface ArticleSummary extends SummaryResult {
  basis: 'content' | 'excerpt'
}

export function isSummaryResult(value: unknown): value is SummaryResult {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.overview === 'string' &&
    Boolean(item.overview.trim()) &&
    item.overview.length <= 800 &&
    Array.isArray(item.keyPoints) &&
    item.keyPoints.length >= 3 &&
    item.keyPoints.length <= 5 &&
    item.keyPoints.every(
      (point: unknown) => typeof point === 'string' && Boolean(point.trim()) && point.length <= 500
    )
  )
}

export function isArticleSummary(value: unknown): value is ArticleSummary {
  return (
    isSummaryResult(value) &&
    'basis' in value &&
    (value.basis === 'content' || value.basis === 'excerpt')
  )
}
