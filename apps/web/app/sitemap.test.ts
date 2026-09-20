import { afterEach, expect, it, vi } from 'vitest'
import { GET as getChildSitemap } from './sitemap/[id]/route'
import { GET as getSitemapXml } from './sitemap.xml/route'

let mockError = false
let mockArticleCount = 1

vi.mock('../lib/supabase', () => ({
  getPublicSupabaseClient: () => ({
    from: (table: string) => {
      if (mockError) {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => Promise.resolve({ data: null, error: { message: 'DB down' } })
              })
            }),
            order: () => ({
              order: () => ({
                range: () => Promise.resolve({ data: null, error: { message: 'DB down' } })
              })
            })
          })
        }
      }
      if (table === 'ai_events') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () =>
                  Promise.resolve({
                    data: [{ id: '1', slug: 'test-event', updated_at: '2026-01-01' }],
                    error: null
                  })
              })
            })
          })
        }
      }
      if (table === 'signal_articles') {
        return {
          select: (_fields?: string, options?: { count?: string; head?: boolean }) => {
            if (options?.head) {
              return Promise.resolve({ count: mockArticleCount, error: null })
            }
            return {
              order: () => ({
                order: () => ({
                  range: () =>
                    Promise.resolve({
                      data: [
                        {
                          id: '550e8400-e29b-41d4-a716-446655440000',
                          source: 'xinhua',
                          title: '测试新闻标题',
                          published_at: '2026-09-01T00:00:00Z',
                          last_seen_at: '2026-09-01T01:00:00Z',
                          content_updated_at: '2026-09-02T03:00:00Z'
                        }
                      ],
                      error: null
                    })
                })
              })
            }
          }
        }
      }
      return { select: () => ({}) }
    }
  })
}))

afterEach(() => {
  mockError = false
  mockArticleCount = 1
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
  mockArticleCount = 999

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
  mockArticleCount = 2001

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
  mockArticleCount = 2001

  const res = await getChildSitemap(new Request('https://news.ljhboard.cn/sitemap/1.xml'), {
    params: Promise.resolve({ id: '1.xml' })
  })

  expect(res.status).toBe(200)
  const xml = await res.text()
  expect(xml).toContain('<urlset')
  expect(xml).toContain('550e8400-e29b-41d4-a716-446655440000')
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

it('gracefully handles database errors without throwing exceptions', async () => {
  mockError = true
  vi.stubEnv('SITE_URL', 'https://news.ljhboard.cn')

  const res = await getSitemapXml()
  expect(res.status).toBe(200)
  const xml = await res.text()
  expect(xml).toContain('<urlset')
  expect(xml).toContain('<loc>https://news.ljhboard.cn/</loc>')
})
