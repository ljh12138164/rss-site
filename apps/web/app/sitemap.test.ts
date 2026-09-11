import { afterEach, expect, it, vi } from 'vitest'
import sitemap from './sitemap'

let mockError = false

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
          select: () => ({
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
                        last_seen_at: '2026-09-01T01:00:00Z'
                      }
                    ],
                    error: null
                  })
              })
            })
          })
        }
      }
      return { select: () => ({}) }
    }
  })
}))

afterEach(() => {
  mockError = false
  vi.unstubAllEnvs()
})

it('includes core static routes, sections, sources, events, and platform articles in sitemap', async () => {
  vi.stubEnv('SITE_URL', 'https://news.ljhboard.cn')
  const entries = await sitemap()
  const urls = entries.map((e) => e.url)
  expect(urls).toContain('https://news.ljhboard.cn/')
  expect(urls).toContain('https://news.ljhboard.cn/about')
  expect(urls).toContain('https://news.ljhboard.cn/privacy')
  expect(urls).toContain('https://news.ljhboard.cn/github')
  expect(urls).toContain('https://news.ljhboard.cn/ai')
  expect(urls).toContain('https://news.ljhboard.cn/news')
  expect(urls).toContain('https://news.ljhboard.cn/news/xinhua')
  expect(urls).toContain('https://news.ljhboard.cn/ai/events')
  expect(urls).toContain('https://news.ljhboard.cn/ai/events/test-event')
  expect(
    urls.some(
      (u) => u.includes('news/xinhua/') && u.includes('550e8400-e29b-41d4-a716-446655440000')
    )
  ).toBe(true)
})

it('gracefully handles database errors without throwing exceptions', async () => {
  mockError = true
  vi.stubEnv('SITE_URL', 'https://news.ljhboard.cn')
  const entries = await sitemap()
  expect(entries.length).toBeGreaterThan(0)
  expect(entries.map((e) => e.url)).toContain('https://news.ljhboard.cn/')
})


