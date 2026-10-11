import { afterEach, expect, it, vi } from 'vitest'
import { GET as getChildSitemap } from './sitemap/[id]/route'
import { GET as getSitemapXml } from './sitemap.xml/route'

let mockError = false
let mockArticleCount = 1
const { cached, databaseCalls, articleFilters } = vi.hoisted(() => ({
  cached: new Map<string, unknown>(),
  databaseCalls: vi.fn(),
  articleFilters: vi.fn()
}))

vi.mock('next/cache', () => ({
  unstable_cache:
    (read: (...args: unknown[]) => Promise<unknown>, keys: string[]) =>
    async (...args: unknown[]) => {
      const key = JSON.stringify([keys, args])
      if (cached.has(key)) return cached.get(key)
      const value = await read(...args)
      cached.set(key, value)
      return value
    }
}))

vi.mock('../lib/supabase', () => ({
  getPublicSupabaseClient: () => ({
    from: (table: string) => {
      let head = false
      let start = 0
      let end = 999
      const query = {
        select: (fields: string, options?: { head?: boolean }) => {
          expect(fields).not.toContain('content_html')
          head = options?.head === true
          return query
        },
        eq: (key: string, value: unknown) => {
          if (table === 'signal_articles') articleFilters(key, value)
          return query
        },
        order: () => query,
        in: () => query,
        limit: () => query,
        gt: () => query,
        range: (from: number, to: number) => {
          start = from
          end = to
          return query
        },
        abortSignal: async () => {
          databaseCalls(table)
          if (mockError) return { data: null, count: null, error: { message: 'DB down' } }
          if (head) return { count: mockArticleCount, error: null }
          if (table === 'ai_events')
            return {
              data: [{ id: '1', slug: 'test-event', updated_at: '2026-01-01' }],
              error: null
            }
          return {
            data: Array.from(
              { length: Math.max(0, Math.min(end + 1, mockArticleCount) - start) },
              (_, i) => ({
                id:
                  start + i === 0
                    ? '550e8400-e29b-41d4-a716-446655440000'
                    : `550e8400-e29b-41d4-a716-${String(start + i).padStart(12, '0')}`,
                source: 'xinhua',
                title: '测试新闻标题',
                published_at: '2026-09-01T00:00:00Z',
                last_seen_at: '2026-09-01T01:00:00Z',
                content_updated_at: '2026-09-02T03:00:00Z'
              })
            ),
            error: null
          }
        }
      }
      return query
    }
  })
}))

afterEach(() => {
  mockError = false
  mockArticleCount = 1
  cached.clear()
  databaseCalls.mockClear()
  articleFilters.mockClear()
  vi.unstubAllEnvs()
})

it('returns 404 for sitemap routes when SITE_URL is not configured', async () => {
  vi.stubEnv('SITE_URL', '')

  const root = await getSitemapXml()
  const child = await getChildSitemap(new Request('http://localhost/sitemap/0.xml'), {
    params: Promise.resolve({ id: '0.xml' })
  })

  expect(root.status).toBe(404)
  expect(child.status).toBe(404)
})

it('within limit: /sitemap.xml returns full urlset XML with all platform articles', async () => {
  vi.stubEnv('SITE_URL', 'https://news.ljhboard.cn')
  mockArticleCount = 1000

  const res = await getSitemapXml()
  expect(res.status).toBe(200)
  expect(res.headers.get('content-type')).toContain('application/xml')
  expect(res.headers.get('cache-control')).toContain('s-maxage=7200')

  const xml = await res.text()
  expect(xml).toContain('<urlset')
  expect(xml).not.toContain('<sitemapindex')
  expect(xml).toContain('<loc>https://news.ljhboard.cn/</loc>')
  expect(xml).toContain('<loc>https://news.ljhboard.cn/about</loc>')
  expect(xml).toContain('<loc>https://news.ljhboard.cn/privacy</loc>')
  expect(xml).toContain('<loc>https://news.ljhboard.cn/github</loc>')
  expect(xml).toContain('<loc>https://news.ljhboard.cn/skills</loc>')
  expect(xml).toContain('<loc>https://news.ljhboard.cn/mcp</loc>')
  expect(xml).toContain('<loc>https://news.ljhboard.cn/ai</loc>')
  expect(xml).toContain('<loc>https://news.ljhboard.cn/news/xinhua</loc>')
  expect(xml).toContain('<loc>https://news.ljhboard.cn/ai/events/test-event</loc>')
  expect(xml).toContain('550e8400-e29b-41d4-a716-446655440000')
  expect(xml).toContain('<lastmod>2026-09-02T03:00:00Z</lastmod>')
})

it('over limit: /sitemap.xml automatically upgrades to sitemapindex referencing child files', async () => {
  vi.stubEnv('SITE_URL', 'https://news.ljhboard.cn')
  mockArticleCount = 10001

  const res = await getSitemapXml()
  expect(res.status).toBe(200)
  const xml = await res.text()

  expect(xml).toContain('<sitemapindex')
  expect(xml).toContain('<loc>https://news.ljhboard.cn/sitemap/0.xml</loc>')
  expect(xml).toContain('<loc>https://news.ljhboard.cn/sitemap/1.xml</loc>')
  expect(xml).toContain('<loc>https://news.ljhboard.cn/sitemap/2.xml</loc>')
  expect(res.headers.get('cache-control')).toContain('stale-while-revalidate=86400')
})

it('child sitemap /sitemap/[id].xml serves chunked urlset for valid chunk IDs', async () => {
  vi.stubEnv('SITE_URL', 'https://news.ljhboard.cn')
  mockArticleCount = 10001

  const res = await getChildSitemap(new Request('https://news.ljhboard.cn/sitemap/1.xml'), {
    params: Promise.resolve({ id: '1.xml' })
  })

  expect(res.status).toBe(200)
  const xml = await res.text()
  expect(xml).toContain('<urlset')
  expect(xml).toContain('<lastmod>2026-09-02T03:00:00Z</lastmod>')
  expect(xml.match(/<url>/g)).toHaveLength(2000)
  expect(res.headers.get('cache-control')).toContain('s-maxage=7200')
})

it('child sitemap returns 404 for out of range chunk IDs', async () => {
  vi.stubEnv('SITE_URL', 'https://news.ljhboard.cn')
  mockArticleCount = 1000

  const res = await getChildSitemap(new Request('https://news.ljhboard.cn/sitemap/99.xml'), {
    params: Promise.resolve({ id: '99.xml' })
  })

  expect(res.status).toBe(404)
})

it('returns retryable 503 on database errors and does not cache a truncated sitemap', async () => {
  mockError = true
  vi.stubEnv('SITE_URL', 'https://news.ljhboard.cn')

  const res = await getSitemapXml()
  expect(res.status).toBe(503)
  expect(res.headers.get('cache-control')).toBe('no-store')
  mockError = false
  expect((await getSitemapXml()).status).toBe(200)
})

it('reuses cached XML and queries only indexable article metadata', async () => {
  vi.stubEnv('SITE_URL', 'https://news.ljhboard.cn')
  const first = await (await getSitemapXml()).text()
  const reads = databaseCalls.mock.calls.length
  expect(await (await getSitemapXml()).text()).toBe(first)
  expect(databaseCalls).toHaveBeenCalledTimes(reads)
  expect(articleFilters).toHaveBeenCalledWith('is_indexable', true)
})

it('bounds shards including catalog entries without losing articles at the boundary', async () => {
  vi.stubEnv('SITE_URL', 'https://news.ljhboard.cn')
  mockArticleCount = 2500
  const pages: string[] = []
  for (const id of ['0.xml', '1.xml'])
    pages.push(
      await (
        await getChildSitemap(new Request(`https://news.ljhboard.cn/sitemap/${id}`), {
          params: Promise.resolve({ id })
        })
      ).text()
    )
  const links = pages.flatMap((xml) =>
    [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1])
  )
  expect(new Set(links).size).toBe(links.length)
  expect(links.filter((url) => url.includes('/news/xinhua/') && url.includes('--'))).toHaveLength(
    2500
  )
  expect(pages[0].match(/<url>/g)).toHaveLength(2000)
})

it('rejects malformed shard IDs before querying the database', async () => {
  vi.stubEnv('SITE_URL', 'https://news.ljhboard.cn')
  for (const id of ['1junk.xml', '-1.xml', '01.xml', '1.5.xml']) {
    expect(
      (
        await getChildSitemap(new Request(`https://news.ljhboard.cn/sitemap/${id}`), {
          params: Promise.resolve({ id })
        })
      ).status
    ).toBe(404)
  }
  expect(databaseCalls).not.toHaveBeenCalled()
})
