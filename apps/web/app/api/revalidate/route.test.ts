import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { app } from '../../../lib/hono-app'

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

it('publishes a daily issue through its own cache scope and rejects mixed or invalid dates', async () => {
  const batchId = '11111111-1111-4111-8111-111111111111'
  const response = await app.request(request({ dailyReportDate: '2026-11-04', batchId }))
  expect(response.status).toBe(200)
  expect(paths).toHaveBeenCalledWith('/daily')
  expect(paths).toHaveBeenCalledWith('/daily/2026-11-04')
  expect(paths).toHaveBeenCalledWith('/daily/[date]', 'page')
  expect(tags).toHaveBeenCalledWith('daily-reports', { expire: 0 })
  expect(paths).not.toHaveBeenCalledWith('/latest')
  await callbacks[0]()
  expect(publication).toHaveBeenCalledWith(['/daily', '/daily/2026-11-04', '/sitemap.xml'], batchId)
  for (const input of [
    { dailyReportDate: '2026-02-30' },
    { dailyReportDate: '2999-01-01' },
    { dailyReportDate: '2026-11-04', events: [] },
    { dailyReportDate: '2026-11-04', section: 'ai', source: 'openai' },
    { dailyReportDate: '2026-11-04', path: '/admin' }
  ])
    expect((await app.request(request(input))).status).toBe(400)
})

it('schedules external publication only after authorized ISR invalidation', async () => {
  const response = await app.request(request({ section: 'ai', source: 'openai' }))
  expect(response.status).toBe(200)
  expect(paths).toHaveBeenCalledWith('/ai/openai')
  expect(tags).toHaveBeenCalledWith('news-status:openai', { expire: 0 })
  expect(callbacks).toHaveLength(1)
  expect(publication).not.toHaveBeenCalled()
  await callbacks[0]()
  expect(publication).toHaveBeenCalledWith(
    ['/', '/latest', '/sitemap.xml', '/ai', '/ai/openai', '/ai/events'],
    expect.any(String)
  )
})

it('validates and publishes concrete Skill IDs, including a continuation batch', async () => {
  const id = 'mattpocock/skills/tdd'
  expect(
    (await app.request(request({ section: 'skills', source: 'skills-trending', skills: [id] })))
      .status
  ).toBe(200)
  expect(paths).toHaveBeenCalledWith(`/skills/${id}`)
  await callbacks[0]()
  expect(publication).toHaveBeenCalledWith(
    expect.arrayContaining([`/skills/${id}`]),
    expect.any(String)
  )
  expect((await app.request(request({ skills: ['open.feishu.cn/lark-doc'] }))).status).toBe(200)
  expect((await app.request(request({ skills: ['owner/../bad'] }))).status).toBe(400)
  expect(
    (await app.request(request({ section: 'ai', source: 'openai', skills: [id] }))).status
  ).toBe(400)
  expect(
    (await app.request(request({ skills: Array.from({ length: 101 }, () => id) }))).status
  ).toBe(400)
})

it('rejects unauthenticated requests and path injection without invalidating or scheduling work', async () => {
  expect((await app.request(request({ section: 'ai', source: 'openai' }, 'wrong'))).status).toBe(
    401
  )
  expect((await app.request(request({ section: 'ai', source: '../news' }))).status).toBe(400)
  expect((await app.request(request({ events: ['../../admin'] }))).status).toBe(400)
  expect(paths).not.toHaveBeenCalled()
  expect(callbacks).toHaveLength(0)
})

it('does not run external publication if Next invalidation fails', async () => {
  paths.mockImplementationOnce(() => {
    throw new Error('cache failure')
  })
  expect((await app.request(request({ events: ['release-12345678'] }))).status).toBe(500)
  expect(callbacks).toHaveLength(0)
})

it('invalidates concrete linked events and correlates publication to ingestion', async () => {
  const batchId = '11111111-1111-4111-8111-111111111111'
  const response = await app.request(
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
