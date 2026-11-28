import { unstable_getResponseFromNextConfig } from 'next/experimental/testing/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import nextConfig from '../next.config'
import { generateMetadata as generateEventArchiveMetadata } from './ai/events/archive/page'
import { generateMetadata as generateArticleArchiveMetadata } from './archive/[section]/[[...source]]/page'
import robots from './robots'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('robots and archive crawl controls', () => {
  it('disallows dynamic archive pagination and private local routes while explicitly allowing search and AI crawlers', () => {
    vi.stubEnv('SITE_URL', 'https://news.ljhboard.cn')
    const result = robots()
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules]
    const expectedDisallow = [
      '/api/',
      '/stats/api/send',
      '/cron/',
      '/out',
      '/admin',
      '/archive',
      '/ai/events/archive',
      '/reading-list',
      '/following'
    ]

    expect(rules[0]?.userAgent).toBe('*')
    expect(rules[0]?.allow).toBe('/')
    expect(rules[0]?.disallow).toEqual(expectedDisallow)
    expect(rules[1]?.userAgent).toEqual(
      expect.arrayContaining(['Baiduspider', 'Googlebot', 'OAI-SearchBot', 'PerplexityBot'])
    )
    expect(rules[1]?.allow).toBe('/')
    expect(rules[1]?.disallow).toEqual(expectedDisallow)
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

  it('emits public edge cache headers for dynamic public routes and redirects /rss.xml', async () => {
    const headerRules = (await nextConfig.headers?.()) ?? []
    for (const route of ['/ai', '/daily', '/skills', '/github', '/ai/events']) {
      const rule = headerRules.find((entry) => entry.source === route)
      expect(rule?.headers, route).toContainEqual({
        key: 'Cache-Control',
        value: 'public, max-age=0, s-maxage=300, stale-while-revalidate=600'
      })
    }
    const redirects = (await nextConfig.redirects?.()) ?? []
    expect(redirects).toContainEqual({
      source: '/rss.xml',
      destination: '/feeds/ai.xml',
      statusCode: 301
    })
  })

  it('allows Cloudflare to refresh only public homepage and daily HTML in the background', async () => {
    const edgeCacheControl = 'Cloudflare-CDN-Cache-Control'
    const response = (path: string, headers?: Record<string, string>) =>
      unstable_getResponseFromNextConfig({
        url: `https://news.ljhboard.cn${path}`,
        nextConfig,
        headers
      })

    for (const path of ['/', '/daily']) {
      const result = await response(path)
      expect(result.headers.get(edgeCacheControl)).toBe(
        'public, max-age=300, stale-while-revalidate=600'
      )
      expect(result.headers.get('Cache-Control')).toBe(
        'public, max-age=0, s-maxage=300, stale-while-revalidate=600'
      )
    }

    for (const result of await Promise.all([
      response('/?_rsc=abc'),
      response('/daily', { rsc: '1' }),
      response('/daily', { 'next-router-prefetch': '1' }),
      response('/daily', { authorization: 'Bearer test' }),
      response('/stats/api/send'),
      response('/reading-list')
    ])) {
      expect(result.headers.get(edgeCacheControl)).toBeNull()
    }
  })
})
