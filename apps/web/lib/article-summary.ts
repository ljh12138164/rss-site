import { type ArticleSummary, isArticleSummary } from './article-summary-result'

export class SummaryRequestError extends Error {
  constructor(readonly status: 404 | 413 | 422 | 429 | 503) {
    super('SUMMARY_UNAVAILABLE')
  }
}

export async function requestArticleSummary(
  id: string,
  signal?: AbortSignal
): Promise<ArticleSummary> {
  try {
    const token = process.env.AGENT_SERVICE_TOKEN?.trim()
    const base = new URL(process.env.AGENT_SERVICE_URL ?? '')
    if (
      !token ||
      !['http:', 'https:'].includes(base.protocol) ||
      base.username ||
      base.password ||
      base.search ||
      base.hash ||
      base.pathname !== '/'
    )
      throw new Error()
    const response = await fetch(new URL('/v1/agents/article-summary/invoke', base).href, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
      signal: AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(125_000)]),
      redirect: 'error',
      cache: 'no-store'
    })
    if (!response.ok) {
      const status = response.status
      throw new SummaryRequestError(
        status === 404 || status === 413 || status === 422 || status === 429 ? status : 503
      )
    }
    const result: unknown = await response.json()
    if (!isArticleSummary(result)) throw new Error()
    return { overview: result.overview, keyPoints: result.keyPoints, basis: result.basis }
  } catch (error) {
    if (error instanceof SummaryRequestError) throw error
    throw new SummaryRequestError(503)
  }
}
