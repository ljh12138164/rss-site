import { convert } from 'html-to-text'
import { renderArticleContent } from './article-content'
import {
  ARTICLE_SUMMARY_VERSION,
  type ArticleSummary,
  isArticleSummary,
  isSummaryResult,
  type SummaryResult
} from './article-summary-result'
import { createResultCacheKey, readResultCache, writeResultCache } from './redis-cache'
import type { SignalArticle } from './signal-article'

export class SummaryBusyError extends Error {}

export function articleSummaryInput(article: SignalArticle, section: string) {
  const raw = article.contentHtml ?? ''
  if (Buffer.byteLength(raw, 'utf8') > 512 * 1024) throw new Error('SUMMARY_TOO_LONG')
  const body = convert(renderArticleContent(raw, article.url, section), {
    wordwrap: false,
    selectors: [
      { selector: 'a', options: { ignoreHref: true } },
      { selector: 'img', format: 'skip' }
    ]
  }).trim()
  const excerpt = convert(article.summary ?? '', { wordwrap: false }).trim()
  const content = body || excerpt
  if (!content) throw new Error('SUMMARY_EMPTY')
  if (
    !article.title.trim() ||
    article.title.trim().length > 500 ||
    Buffer.byteLength(content, 'utf8') > 20_000
  )
    throw new Error('SUMMARY_TOO_LONG')
  return {
    title: article.title.trim(),
    content,
    basis: body ? ('content' as const) : ('excerpt' as const)
  }
}

export async function requestArticleSummary(input: {
  title: string
  content: string
}): Promise<SummaryResult> {
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
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(125_000),
      redirect: 'error',
      cache: 'no-store'
    })
    if (!response.ok) throw new Error()
    const result: unknown = await response.json()
    if (!isSummaryResult(result)) throw new Error()
    return { overview: result.overview, keyPoints: result.keyPoints }
  } catch {
    throw new Error('SUMMARY_UNAVAILABLE')
  }
}

const inflight = new Map<string, Promise<ArticleSummary>>()

export async function summarizeArticleOnce(
  article: SignalArticle,
  section: string,
  generate = requestArticleSummary
): Promise<ArticleSummary> {
  const { title, content, basis } = articleSummaryInput(article, section)
  const key = createResultCacheKey('article-summary', ARTICLE_SUMMARY_VERSION, {
    id: article.id,
    title,
    content,
    basis
  })
  const cached = await readResultCache(key, isArticleSummary)
  if (cached) return cached
  const existing = inflight.get(key)
  if (existing) return existing
  if (inflight.size >= 2) throw new SummaryBusyError('SUMMARY_BUSY')
  const pending = (async () => {
    const result = await generate({ title, content })
    if (!isSummaryResult(result)) throw new Error('SUMMARY_UNAVAILABLE')
    const summary: ArticleSummary = {
      overview: result.overview,
      keyPoints: result.keyPoints,
      basis
    }
    await writeResultCache(key, summary)
    return summary
  })().finally(() => {
    inflight.delete(key)
  })
  inflight.set(key, pending)
  return pending
}
