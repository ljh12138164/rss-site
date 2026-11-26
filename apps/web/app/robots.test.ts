import { afterEach, describe, expect, it, vi } from 'vitest'
import nextConfig from '../next.config'
import { generateMetadata as generateEventArchiveMetadata } from './ai/events/archive/page'
import { generateMetadata as generateArticleArchiveMetadata } from './archive/[section]/[[...source]]/page'
import robots from './robots'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('robots and archive crawl controls', () => {
  it('disallows dynamic archive pagination routes while preserving public content crawling', () => {
    vi.stubEnv('SITE_URL', 'https://news.ljhboard.cn')
    const result = robots()
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules

    expect(rule?.userAgent).toBe('*')
    expect(rule?.allow).toBe('/')
    expect(rule?.disallow).toEqual([
      '/api/',
      '/cron/',
      '/out',
      '/admin',
      '/archive',
      '/ai/events/archive'
    ])
    expect(result.sitemap).toBe('https://news.ljhboard.cn/sitemap.xml')
  })

  it('marks article archive pagination pages as noindex, nofollow', async () => {
    vi.stubEnv('SITE_URL', 'https://news.ljhboard.cn')
    const cursor = JSON.stringify({
      id: '550e8400-e29b-41d4-a716-446655440000',
      publishedAt: '2026-11-20T00:00:00.000Z',
      snapshot: '2026-11-26T00:00:00.000Z'
    })
    const metadata = await generateArticleArchiveMetadata({
      params: Promise.resolve({ section: 'news', source: ['xinhua'] }),
      searchParams: Promise.resolve({ cursor })
    })

    expect(metadata.robots).toEqual({ index: false, follow: false })
  })

  it('marks AI event archive pagination pages as noindex, nofollow', async () => {
    vi.stubEnv('SITE_URL', 'https://news.ljhboard.cn')
    const cursor = Buffer.from(
      JSON.stringify({
        id: '550e8400-e29b-41d4-a716-446655440000',
        date: '2026-11-20T00:00:00.000Z',
        snapshot: '2026-11-26T00:00:00.000Z'
      })
    ).toString('base64url')
    const metadata = await generateEventArchiveMetadata({
      searchParams: Promise.resolve({ cursor })
    })

    expect(metadata.robots).toEqual({ index: false, follow: false })
  })

  it('emits X-Robots-Tag: noindex, nofollow headers for archive pagination routes', async () => {
    const headerRules = (await nextConfig.headers?.()) ?? []
    const articleRule = headerRules.find((entry) => entry.source === '/archive/:path*')
    const eventRule = headerRules.find((entry) => entry.source === '/ai/events/archive')

    expect(articleRule?.headers).toContainEqual({
      key: 'X-Robots-Tag',
      value: 'noindex, nofollow'
    })
    expect(eventRule?.headers).toContainEqual({
      key: 'X-Robots-Tag',
      value: 'noindex, nofollow'
    })
  })
})
