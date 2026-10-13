import { beforeEach, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ load: vi.fn(), summarize: vi.fn() }))
vi.mock('./signal-article', () => ({ getNewsArticle: mocks.load }))
vi.mock('./article-summary', async (original) => ({
  ...(await original<typeof import('./article-summary')>()),
  requestArticleSummary: mocks.summarize
}))

import { SummaryRequestError } from './article-summary'
import { app } from './hono-app'

const id = '550e8400-e29b-41d4-a716-446655440000'
const result = { overview: '概述', keyPoints: ['一', '二', '三'], basis: 'content' }
beforeEach(() => {
  mocks.load.mockReset()
  mocks.summarize.mockReset().mockResolvedValue(result)
})
function post(body: unknown) {
  return app.request('/api/articles/summarize', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  })
}
it('rejects invalid identity and caller text, forwarding only an ID without querying the database', async () => {
  for (const body of [
    { id: 'bad' },
    { id, source: 'openai' },
    { id, content: 'Caller text' },
    null
  ])
    expect((await post(body)).status).toBe(400)
  expect(mocks.summarize).not.toHaveBeenCalled()
  const response = await post({ id })
  expect(response.status).toBe(200)
  expect(response.headers.get('cache-control')).toBe('no-store')
  expect(await response.json()).toEqual({ summary: result })
  expect(mocks.summarize).toHaveBeenCalledWith(id, expect.any(AbortSignal))
  expect(mocks.load).not.toHaveBeenCalled()
})
it.each([404, 413, 422, 429, 503] as const)('maps %i to a public error', async (status) => {
  mocks.summarize.mockRejectedValue(new SummaryRequestError(status))
  const response = await post({ id })
  expect(response.status).toBe(status)
  expect(JSON.stringify(await response.json())).not.toContain('SUMMARY_UNAVAILABLE')
})
