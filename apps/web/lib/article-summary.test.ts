import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import {
  articleSummaryInput,
  requestArticleSummary,
  SummaryBusyError,
  summarizeArticleOnce
} from './article-summary'
import type { SignalArticle } from './signal-article'

const cache = vi.hoisted(() => new Map<string, string>())
vi.mock('./redis-cache', async (original) => ({
  ...(await original<typeof import('./redis-cache')>()),
  readResultCache: async (key: string, validate: (value: unknown) => boolean) => {
    const value: unknown = JSON.parse(cache.get(key) ?? 'null')
    return validate(value) ? value : null
  },
  writeResultCache: async (key: string, value: unknown) => {
    cache.set(key, JSON.stringify(value))
  }
}))
const article: SignalArticle = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  source: 'openai',
  sourceKey: 'one',
  title: 'New model',
  url: 'https://example.com/article',
  summary: 'Source excerpt',
  contentHtml: '<p>First &amp; second.</p><p>Next.</p><script>bad()</script>',
  author: null,
  publishedAt: null,
  firstSeenAt: new Date(),
  lastSeenAt: new Date()
}
const output = { overview: '文章概述', keyPoints: ['第一点', '第二点', '第三点'] }
beforeEach(() => {
  cache.clear()
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

it('extracts clean full text with paragraph boundaries, or explicitly falls back to excerpt', () => {
  expect(articleSummaryInput(article, 'ai')).toEqual({
    title: 'New model',
    content: 'First & second.\n\nNext.',
    basis: 'content'
  })
  expect(articleSummaryInput({ ...article, contentHtml: null }, 'ai')).toMatchObject({
    content: 'Source excerpt',
    basis: 'excerpt'
  })
  expect(() => articleSummaryInput({ ...article, contentHtml: null, summary: null }, 'ai')).toThrow(
    'SUMMARY_EMPTY'
  )
  expect(() =>
    articleSummaryInput({ ...article, contentHtml: `<p>${'中'.repeat(7000)}</p>` }, 'ai')
  ).toThrow('SUMMARY_TOO_LONG')
})

it('calls only the configured Nest service with a server token and validates output', async () => {
  vi.stubEnv('AGENT_SERVICE_URL', 'http://127.0.0.1:3001')
  vi.stubEnv('AGENT_SERVICE_TOKEN', 'server-token')
  const fetcher = vi.fn(async () => Response.json(output))
  vi.stubGlobal('fetch', fetcher)
  expect(await requestArticleSummary({ title: article.title, content: 'Content' })).toEqual(output)
  expect(fetcher).toHaveBeenCalledWith(
    'http://127.0.0.1:3001/v1/agents/article-summary/invoke',
    expect.objectContaining({
      headers: { authorization: 'Bearer server-token', 'content-type': 'application/json' },
      redirect: 'error',
      cache: 'no-store'
    })
  )
  fetcher.mockResolvedValueOnce(Response.json({ overview: 'bad', keyPoints: [] }))
  await expect(requestArticleSummary({ title: 'Title', content: 'Content' })).rejects.toThrow(
    'SUMMARY_UNAVAILABLE'
  )
  fetcher.mockResolvedValueOnce(Response.json({ error: 'private-token' }, { status: 502 }))
  await expect(requestArticleSummary({ title: 'Title', content: 'Content' })).rejects.toThrow(
    'SUMMARY_UNAVAILABLE'
  )
})

it('deduplicates concurrent summaries, reuses valid cache and invalidates when text changes', async () => {
  const generate = vi.fn(async () => output)
  const [first, second] = await Promise.all([
    summarizeArticleOnce(article, 'ai', generate),
    summarizeArticleOnce(article, 'ai', generate)
  ])
  expect(first).toEqual({ ...output, basis: 'content' })
  expect(second).toEqual(first)
  expect(generate).toHaveBeenCalledTimes(1)
  await summarizeArticleOnce(article, 'ai', generate)
  expect(generate).toHaveBeenCalledTimes(1)
  await summarizeArticleOnce({ ...article, contentHtml: '<p>Changed</p>' }, 'ai', generate)
  expect(generate).toHaveBeenCalledTimes(2)
})

it('failed inference is not cached and the same article can retry', async () => {
  const generate = vi.fn().mockRejectedValueOnce(new Error('failed')).mockResolvedValue(output)
  await expect(summarizeArticleOnce(article, 'ai', generate)).rejects.toThrow('failed')
  expect(cache.size).toBe(0)
  await expect(summarizeArticleOnce(article, 'ai', generate)).resolves.toMatchObject(output)
})

it('limits distinct concurrent requests but permits joining an existing task', async () => {
  let finish!: (value: typeof output) => void
  const generate = vi.fn(
    () =>
      new Promise<typeof output>((resolve) => {
        finish = resolve
      })
  )
  const first = summarizeArticleOnce(article, 'ai', generate)
  await vi.waitFor(() => expect(generate).toHaveBeenCalledTimes(1))
  const joined = summarizeArticleOnce(article, 'ai', generate)
  const other = summarizeArticleOnce({ ...article, id: 'other' }, 'ai', async () => output)
  // A second pending task is necessary to exercise the capacity boundary.
  let finishOther!: (value: typeof output) => void
  await other
  const pendingOther = summarizeArticleOnce(
    { ...article, id: 'third' },
    'ai',
    () =>
      new Promise((resolve) => {
        finishOther = resolve
      })
  )
  await vi.waitFor(() => expect(finishOther).toBeTypeOf('function'))
  await expect(
    summarizeArticleOnce({ ...article, id: 'fourth' }, 'ai', generate)
  ).rejects.toBeInstanceOf(SummaryBusyError)
  finish(output)
  finishOther(output)
  await Promise.all([first, joined, pendingOther])
})
