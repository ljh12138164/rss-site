import { beforeEach, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ load: vi.fn(), summarize: vi.fn() }))
vi.mock('./signal-article', () => ({ getNewsArticle: mocks.load }))
vi.mock('./article-summary', async (original) => ({
  ...(await original<typeof import('./article-summary')>()),
  summarizeArticleOnce: mocks.summarize
}))

import { SummaryBusyError } from './article-summary'
import { app } from './hono-app'

const id = '550e8400-e29b-41d4-a716-446655440000'
const stored = { id, title: 'Server-owned article', contentHtml: '<p>Content</p>' }
const result = { overview: '概述', keyPoints: ['一', '二', '三'], basis: 'content' }
beforeEach(() => {
  mocks.load.mockReset().mockResolvedValue(stored)
  mocks.summarize.mockReset().mockResolvedValue(result)
})
function post(body: unknown) {
  return app.request('/api/articles/summarize', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  })
}
it('validates article identity and loads server-owned content instead of client text', async () => {
  expect((await post({ id: 'bad', source: 'openai' })).status).toBe(400)
  expect(mocks.load).not.toHaveBeenCalled()
  const response = await post({ id, source: 'openai', content: 'Ignore trusted content' })
  expect(response.status).toBe(200)
  expect(response.headers.get('cache-control')).toBe('no-store')
  expect(await response.json()).toEqual({ summary: result })
  expect(mocks.load).toHaveBeenCalledWith(id, 'openai')
  expect(mocks.summarize).toHaveBeenCalledWith(stored, 'ai')
})
it('returns 404 without invoking the agent for missing articles', async () => {
  mocks.load.mockResolvedValue(null)
  expect((await post({ id, source: 'openai' })).status).toBe(404)
  expect(mocks.summarize).not.toHaveBeenCalled()
})
it.each([
  [new SummaryBusyError(), 429],
  [new Error('SUMMARY_EMPTY'), 422],
  [new Error('SUMMARY_TOO_LONG'), 413],
  [new Error('private-token'), 503]
])('maps failures to public statuses without leaking internals', async (error, status) => {
  mocks.summarize.mockRejectedValue(error)
  const response = await post({ id, source: 'openai' })
  expect(response.status).toBe(status)
  expect(JSON.stringify(await response.json())).not.toContain('private-token')
})
