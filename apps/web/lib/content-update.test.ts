import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { updateContent } from './content-update'

const { operations, callbacks, path, tag } = vi.hoisted(() => ({
  operations: [] as string[],
  callbacks: [] as (() => Promise<void>)[],
  path: vi.fn(),
  tag: vi.fn()
}))
vi.mock('next/cache', () => ({ revalidatePath: path, revalidateTag: tag }))
vi.mock('next/server', () => ({
  after: (callback: () => Promise<void>) => {
    operations.push('schedule')
    callbacks.push(callback)
  }
}))

beforeEach(() => {
  vi.resetAllMocks()
  operations.length = 0
  callbacks.length = 0
  tag.mockImplementation((value) => operations.push(`tag:${value}`))
  path.mockImplementation((value, type) => operations.push(`${type ?? 'path'}:${value}`))
  vi.stubEnv('SITE_URL', 'https://news.example')
  vi.stubEnv('INDEXNOW_KEY', 'test-key-123')
  vi.stubEnv('CLOUDFLARE_API_TOKEN', '')
  vi.stubEnv('CLOUDFLARE_ZONE_ID', '')
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

it('invalidates tags, concrete pages and dynamic pages before scheduling concrete publication', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 202 }))
  vi.stubGlobal('fetch', fetch)
  const log = vi.spyOn(console, 'info').mockImplementation(() => {})
  const result = updateContent({
    section: '/ai',
    source: 'openai',
    eventSlugs: ['release-12345678'],
    publicationId: '11111111-1111-4111-8111-111111111111'
  })
  expect(operations).toEqual([
    'tag:sitemap',
    'tag:event-status',
    'tag:news-status:openai',
    'path:/',
    'path:/latest',
    'path:/sitemap.xml',
    'path:/ai',
    'path:/ai/openai',
    'path:/ai/events/release-12345678',
    'path:/ai/events',
    'page:/ai/events/[slug]',
    'page:/ai/openai/[slug]',
    'schedule'
  ])
  expect(fetch).not.toHaveBeenCalled()
  expect(result.publicationId).toBe('11111111-1111-4111-8111-111111111111')
  await callbacks[0]()
  expect(JSON.parse(fetch.mock.calls[0][1].body).urlList).toEqual([
    'https://news.example/',
    'https://news.example/latest',
    'https://news.example/ai',
    'https://news.example/ai/openai',
    'https://news.example/ai/events/release-12345678',
    'https://news.example/ai/events'
  ])
  expect(log).toHaveBeenCalledWith(expect.stringContaining(result.publicationId))
})

it('publishes both old and new article URLs after a title edit, once each', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 202 }))
  vi.stubGlobal('fetch', fetch)
  vi.spyOn(console, 'info').mockImplementation(() => {})
  const result = updateContent({
    section: '/news',
    source: 'xinhua',
    article: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      previousTitle: 'Old title',
      title: 'New title'
    }
  })
  const oldPath = '/news/xinhua/old-title--550e8400-e29b-41d4-a716-446655440000'
  const newPath = '/news/xinhua/new-title--550e8400-e29b-41d4-a716-446655440000'
  expect(result.paths).toEqual([
    '/',
    '/latest',
    '/sitemap.xml',
    '/news',
    '/news/xinhua',
    oldPath,
    newPath
  ])
  expect(path).toHaveBeenCalledWith(oldPath)
  expect(path).toHaveBeenCalledWith(newPath)
  await callbacks[0]()
  expect(JSON.parse(fetch.mock.calls[0][1].body).urlList).toContain(
    `https://news.example${oldPath}`
  )
  expect(JSON.parse(fetch.mock.calls[0][1].body).urlList).toContain(
    `https://news.example${newPath}`
  )
})

it('records safe invalidation failure evidence and schedules no publication', () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => {})
  path.mockImplementationOnce(() => {
    throw new Error('private-secret')
  })
  expect(() =>
    updateContent({
      section: '/news',
      source: 'xinhua',
      publicationId: 'known-batch'
    })
  ).toThrow('private-secret')
  expect(callbacks).toHaveLength(0)
  expect(log).toHaveBeenCalledWith(expect.stringContaining('"revalidation":"failed"'))
  expect(log).toHaveBeenCalledWith(expect.stringContaining('known-batch'))
  expect(JSON.stringify(log.mock.calls)).not.toContain('private-secret')
})

it.each([
  ['/technology', 'github', '/github'],
  ['/skills', 'skills-all-time', '/skills'],
  ['/skills', 'skills-trending', '/skills']
])('keeps %s/%s publication on its shared route', async (section, source, route) => {
  const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 202 }))
  vi.stubGlobal('fetch', fetch)
  vi.spyOn(console, 'info').mockImplementation(() => {})
  const result = updateContent({
    section,
    source,
    article: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      previousTitle: 'Old title',
      title: 'New title'
    }
  })
  expect(result.paths).toEqual(['/', '/latest', '/sitemap.xml', route])
  expect(path).not.toHaveBeenCalledWith(`${section}/${source}/[slug]`, 'page')
  await callbacks[0]()
  expect(JSON.parse(fetch.mock.calls[0][1].body).urlList).toEqual([
    'https://news.example/',
    'https://news.example/latest',
    `https://news.example${route}`
  ])
})

it('deduplicates the article URL when a title edit preserves the slug', () => {
  const result = updateContent({
    section: '/news',
    source: 'xinhua',
    article: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      previousTitle: 'Same title',
      title: 'Same title!'
    }
  })
  expect(result.paths).toEqual([
    '/',
    '/latest',
    '/sitemap.xml',
    '/news',
    '/news/xinhua',
    '/news/xinhua/same-title--550e8400-e29b-41d4-a716-446655440000'
  ])
})

it('contains unexpected publication failures and logs only safe identifiers', async () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.stubEnv('SITE_URL', 'private-invalid-url')
  const result = updateContent({ section: '/news', source: 'xinhua' })
  await expect(callbacks[0]()).resolves.toBeUndefined()
  expect(log).toHaveBeenCalledWith(expect.stringContaining(result.publicationId))
  expect(log).toHaveBeenCalledWith(expect.stringContaining('"publication":"failed"'))
  expect(JSON.stringify(log.mock.calls)).not.toContain('private-invalid-url')
})
