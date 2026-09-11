import { afterEach, expect, it, vi } from 'vitest'
import sitemap from './sitemap'

vi.mock('../lib/supabase', () => ({
  getPublicSupabaseClient: () => ({
    from: () => ({
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
    })
  })
}))

afterEach(() => vi.unstubAllEnvs())

it('includes core static routes, sections, sources, and events in sitemap', async () => {
  vi.stubEnv('SITE_URL', 'https://news.ljhboard.cn')
  const entries = await sitemap()
  const urls = entries.map((e) => e.url)
  expect(urls).toContain('https://news.ljhboard.cn/')
  expect(urls).toContain('https://news.ljhboard.cn/about')
  expect(urls).toContain('https://news.ljhboard.cn/privacy')
  expect(urls).toContain('https://news.ljhboard.cn/github')
  expect(urls).toContain('https://news.ljhboard.cn/ai')
  expect(urls).toContain('https://news.ljhboard.cn/news')
  expect(urls).toContain('https://news.ljhboard.cn/ai/events')
  expect(urls).toContain('https://news.ljhboard.cn/ai/events/test-event')
})
