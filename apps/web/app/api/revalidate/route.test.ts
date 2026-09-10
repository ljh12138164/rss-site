import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { POST } from './route'

const { paths, tags, callbacks, publication } = vi.hoisted(() => ({
  paths: vi.fn(),
  tags: vi.fn(),
  callbacks: [] as (() => Promise<void>)[],
  publication: vi.fn()
}))
vi.mock('next/cache', () => ({ revalidatePath: paths, revalidateTag: tags }))
vi.mock('next/server', () => ({ after: (fn: () => Promise<void>) => callbacks.push(fn) }))
vi.mock('../../../lib/content-publication', () => ({ publishContent: publication }))

beforeEach(() => {
  vi.clearAllMocks()
  callbacks.length = 0
  vi.stubEnv('REVALIDATE_SECRET', 'test-secret')
})
afterEach(() => vi.unstubAllEnvs())
const request = (input: unknown, secret = 'test-secret') =>
  new Request('https://news.example/api/revalidate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` },
    body: JSON.stringify(input)
  })

it('schedules external publication only after authorized ISR invalidation', async () => {
  const response = await POST(request({ section: 'ai', source: 'openai' }))
  expect(response.status).toBe(200)
  expect(paths).toHaveBeenCalledWith('/ai/openai')
  expect(tags).toHaveBeenCalledWith('news-status:openai', { expire: 0 })
  expect(callbacks).toHaveLength(1)
  expect(publication).not.toHaveBeenCalled()
  await callbacks[0]()
  expect(publication).toHaveBeenCalledWith(
    ['/', '/sitemap.xml', '/ai', '/ai/openai', '/ai/events'],
    expect.any(String)
  )
})

it('publishes GitHub ingestion to the independent ranking route', async () => {
  const response = await POST(request({ section: 'technology', source: 'github' }))
  expect(response.status).toBe(200)
  expect(paths).toHaveBeenCalledWith('/github')
  expect(paths).not.toHaveBeenCalledWith('/technology/github')
  expect(paths).not.toHaveBeenCalledWith('/technology/github/[slug]', 'page')
  await callbacks[0]()
  expect(publication).toHaveBeenCalledWith(['/', '/sitemap.xml', '/github'], expect.any(String))
})

it('rejects unauthenticated requests and path injection without invalidating or scheduling work', async () => {
  expect((await POST(request({ section: 'ai', source: 'openai' }, 'wrong'))).status).toBe(401)
  expect((await POST(request({ section: 'ai', source: '../news' }))).status).toBe(400)
  expect((await POST(request({ events: ['../../admin'] }))).status).toBe(400)
  expect(paths).not.toHaveBeenCalled()
  expect(callbacks).toHaveLength(0)
})

it('does not run external publication if Next invalidation fails', async () => {
  paths.mockImplementationOnce(() => {
    throw new Error('cache failure')
  })
  expect((await POST(request({ events: ['release-12345678'] }))).status).toBe(500)
  expect(callbacks).toHaveLength(0)
})

it('isolates background integration failures from the successful response', async () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => {})
  publication.mockRejectedValueOnce(new Error('private-value'))
  const response = await POST(request({ events: ['release-12345678'] }))
  expect((await response.json()).revalidated).toBe(true)
  await expect(callbacks[0]()).resolves.toBeUndefined()
  expect(JSON.stringify(log.mock.calls)).not.toContain('private-value')
  log.mockRestore()
})

it('invalidates concrete linked events and correlates publication to ingestion', async () => {
  const batchId = '11111111-1111-4111-8111-111111111111'
  const response = await POST(
    request({ section: 'ai', source: 'openai', events: ['release-12345678'], batchId })
  )
  expect(response.status).toBe(200)
  expect(paths).toHaveBeenCalledWith('/ai/events/release-12345678')
  await callbacks[0]()
  expect(publication).toHaveBeenCalledWith(
    expect.arrayContaining(['/ai/events/release-12345678']),
    batchId
  )
})
