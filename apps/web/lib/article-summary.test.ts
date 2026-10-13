import { afterEach, expect, it, vi } from 'vitest'
import { requestArticleSummary } from './article-summary'

const id = '550e8400-e29b-41d4-a716-446655440000'
const output = { overview: '概述', keyPoints: ['一', '二', '三'], basis: 'content' }
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})
it('sends only the ID with a server token and validates the returned summary', async () => {
  vi.stubEnv('AGENT_SERVICE_URL', 'http://localhost:3001')
  vi.stubEnv('AGENT_SERVICE_TOKEN', 'server-token')
  const fetcher = vi.fn(async () => Response.json(output))
  vi.stubGlobal('fetch', fetcher)
  expect(await requestArticleSummary(id)).toEqual(output)
  expect(fetcher).toHaveBeenCalledWith(
    'http://localhost:3001/v1/agents/article-summary/invoke',
    expect.objectContaining({
      body: JSON.stringify({ id }),
      headers: { authorization: 'Bearer server-token', 'content-type': 'application/json' },
      redirect: 'error',
      cache: 'no-store'
    })
  )
  fetcher.mockResolvedValueOnce(Response.json({ ...output, basis: 'invalid' }))
  await expect(requestArticleSummary(id)).rejects.toMatchObject({ status: 503 })
  fetcher.mockResolvedValueOnce(Response.json({ error: 'private-token' }, { status: 429 }))
  await expect(requestArticleSummary(id)).rejects.toMatchObject({
    status: 429,
    message: 'SUMMARY_UNAVAILABLE'
  })
})
it('does not call an invalid or unconfigured service', async () => {
  vi.stubEnv('AGENT_SERVICE_URL', 'https://user:password@example.com')
  vi.stubEnv('AGENT_SERVICE_TOKEN', 'server-token')
  const fetcher = vi.fn()
  vi.stubGlobal('fetch', fetcher)
  await expect(requestArticleSummary(id)).rejects.toMatchObject({ status: 503 })
  expect(fetcher).not.toHaveBeenCalled()
})
