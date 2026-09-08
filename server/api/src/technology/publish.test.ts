import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { publishSourceUpdate } from './publish.js'
import { getSignalSource } from './sources.js'

const requests: { url: string; init: RequestInit }[] = []
const batchId = '11111111-1111-4111-8111-111111111111'
beforeEach(() => {
  requests.length = 0
  vi.stubEnv('WEB_APP_URL', 'https://news.example')
  vi.stubEnv('REVALIDATE_SECRET', 'private-secret')
  vi.stubGlobal('fetch', async (url: URL, init: RequestInit) => {
    requests.push({ url: url.href, init })
    return Response.json({ revalidated: true })
  })
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

it('does not notify for a successful but unchanged ingestion', async () => {
  expect(
    await publishSourceUpdate(getSignalSource('openai'), { changed: false, events: [], batchId })
  ).toBe('unchanged')
  expect(requests).toHaveLength(0)
})
it('carries the ingestion batch and every affected event in bounded requests', async () => {
  const events = Array.from({ length: 101 }, (_, i) => `event-${i}`)
  expect(
    await publishSourceUpdate(getSignalSource('openai'), { changed: true, events, batchId })
  ).toBe('revalidated')
  expect(requests).toHaveLength(2)
  expect(JSON.parse(String(requests[0].init.body))).toEqual({
    section: 'ai',
    source: 'openai',
    events: events.slice(0, 100),
    batchId
  })
  expect(JSON.parse(String(requests[1].init.body))).toEqual({ events: ['event-100'], batchId })
  expect(requests.every((r) => r.init.redirect === 'error')).toBe(true)
})
it('reports a rejected notification without throwing after ingestion', async () => {
  vi.stubGlobal('fetch', async () => new Response('', { status: 503 }))
  expect(
    await publishSourceUpdate(getSignalSource('openai'), { changed: true, events: [], batchId })
  ).toBe('failed')
})
