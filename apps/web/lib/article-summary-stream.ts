import { type ArticleSummary, isArticleSummary, type SummaryResult } from './article-summary-result'

const unavailable = '暂时无法生成总结，请稍后重试'

// Drafts are display-only. Resolve only after a validated done event AND clean EOF.
export async function readSummaryStream(
  response: Response,
  progress: (summary: SummaryResult | null) => void
): Promise<ArticleSummary> {
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null)
    throw new Error(
      payload &&
        typeof payload === 'object' &&
        'error' in payload &&
        typeof payload.error === 'string'
        ? payload.error
        : unavailable
    )
  }
  if (!response.body || !response.headers.get('content-type')?.includes('application/x-ndjson'))
    throw new Error(unavailable)
  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8', { fatal: true })
  let buffer = ''
  let bytes = 0
  let result: ArticleSummary | undefined
  const consume = (line: string) => {
    const event: unknown = JSON.parse(line)
    if (!event || typeof event !== 'object' || !('type' in event) || result)
      throw new Error(unavailable)
    if (event.type === 'reset') {
      progress(null)
    } else if (event.type === 'partial' && 'summary' in event) {
      const draft = event.summary as SummaryResult | null
      if (
        !draft ||
        typeof draft.overview !== 'string' ||
        draft.overview.length > 800 ||
        !Array.isArray(draft.keyPoints) ||
        draft.keyPoints.length > 5 ||
        !draft.keyPoints.every((point) => typeof point === 'string' && point.length <= 500)
      )
        throw new Error(unavailable)
      progress({ overview: draft.overview, keyPoints: draft.keyPoints })
    } else if (event.type === 'done' && 'summary' in event && isArticleSummary(event.summary)) {
      result = event.summary
    } else {
      throw new Error(unavailable)
    }
  }
  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (value) bytes += value.byteLength
      if (bytes > 4 * 1024 * 1024) throw new Error(unavailable)
      buffer += decoder.decode(value, { stream: !done })
      let newline = buffer.indexOf('\n')
      while (newline !== -1) {
        const line = buffer.slice(0, newline)
        buffer = buffer.slice(newline + 1)
        if (line.length > 16_384) throw new Error(unavailable)
        if (line.trim()) consume(line)
        newline = buffer.indexOf('\n')
      }
      if (buffer.length > 16_384) throw new Error(unavailable)
      if (done) break
    }
    if (buffer.trim() || !result) throw new Error(unavailable)
    return result
  } catch {
    await reader.cancel().catch(() => undefined)
    throw new Error(unavailable)
  } finally {
    reader.releaseLock()
  }
}
