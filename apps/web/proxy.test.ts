import { NextRequest } from 'next/server'
import { describe, expect, it, vi } from 'vitest'
import { getContentStatus, getDailyReportStatus } from './lib/content-status'
import { proxy } from './proxy'

vi.mock('./lib/content-status', () => ({
  getContentStatus: vi.fn(),
  getDailyReportStatus: vi.fn()
}))

describe('daily report HTTP visibility', () => {
  it('rejects an impossible date before querying the database', async () => {
    vi.mocked(getDailyReportStatus).mockClear()
    expect((await proxy(new NextRequest('https://example.com/daily/2026-02-30'))).status).toBe(404)
    expect(getDailyReportStatus).not.toHaveBeenCalled()
  })
  it.each([200, 404] as const)(
    'checks published metadata before streaming (%s)',
    async (status) => {
      vi.mocked(getDailyReportStatus).mockResolvedValueOnce(status)
      const response = await proxy(new NextRequest('https://example.com/daily/2026-11-04'))
      expect(response.status).toBe(status)
      expect(getDailyReportStatus).toHaveBeenLastCalledWith('2026-11-04')
      if (status === 404) expect(response.headers.get('x-robots-tag')).toBe('noindex')
    }
  )
  it('returns 503 instead of caching database failure as an absent report', async () => {
    vi.mocked(getDailyReportStatus).mockRejectedValueOnce(new Error('unavailable'))
    const response = await proxy(new NextRequest('https://example.com/daily/2026-11-04'))
    expect(response.status).toBe(503)
    expect(response.headers.get('cache-control')).toBe('no-store')
  })
})

describe('technology source proxy', () => {
  it('lets the timeline archive validate its own cursor without an event lookup', async () => {
    vi.mocked(getContentStatus).mockClear()
    const response = await proxy(
      new NextRequest('https://example.com/ai/events/archive?cursor=bad')
    )
    expect(response.headers.get('x-middleware-next')).toBe('1')
    expect(getContentStatus).not.toHaveBeenCalled()
  })

  it.each([404, 410] as const)('returns %s for unavailable article contents', async (status) => {
    vi.mocked(getContentStatus).mockResolvedValueOnce(status)
    const response = await proxy(
      new NextRequest('https://example.com/ai/openai/story--550e8400-e29b-41d4-a716-446655440000')
    )
    expect(response.status).toBe(status)
    expect(response.headers.get('x-robots-tag')).toBe('noindex')
  })

  it('fails closed when visibility cannot be checked', async () => {
    vi.mocked(getContentStatus).mockRejectedValueOnce(new Error('unavailable'))
    const response = await proxy(
      new NextRequest('https://example.com/ai/openai/story--550e8400-e29b-41d4-a716-446655440000')
    )
    expect(response.status).toBe(503)
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('rewrites an unsupported source to the 404 page with a 404 status', async () => {
    const response = await proxy(new NextRequest('https://example.com/technology/nope'))

    expect(response.status).toBe(404)
    expect(response.headers.get('x-middleware-rewrite')).toBe('https://example.com/404')
  })

  it('accepts only confirmed news sources on news routes', async () => {
    const known = await proxy(new NextRequest('https://example.com/news/xinhua'))
    const wrongSection = await proxy(new NextRequest('https://example.com/news/github'))

    expect(known.headers.get('x-middleware-next')).toBe('1')
    expect(wrongSection.status).toBe(404)
  })

  it('301-redirects multi-encoded article slugs to the canonical single-encoded path before DB lookup', async () => {
    vi.mocked(getContentStatus).mockClear()
    const id = '550e8400-e29b-41d4-a716-446655440000'
    const single = encodeURIComponent(`邓超演唱会公开告白孙俪--${id}`)
    const triple = encodeURIComponent(encodeURIComponent(single))

    const response = await proxy(new NextRequest(`https://example.com/news/baidu/${triple}`))

    expect(response.status).toBe(301)
    expect(response.headers.get('location')).toBe(`/news/baidu/${single}`)
    expect(response.headers.get('cache-control')).toContain('s-maxage=86400')
    expect(getContentStatus).not.toHaveBeenCalled()
  })

  it('301-redirects legacy overly long single-encoded Chinese slugs to the clamped canonical slug', async () => {
    vi.mocked(getContentStatus).mockClear()
    const id = '550e8400-e29b-41d4-a716-446655440000'
    const longSlug = encodeURIComponent(
      `数码日常-感觉国内的app厂商在故意不给duo更新啊-适配的好慢-同样的抖音海外早适配了-国内还公测呢--${id}`
    )

    const response = await proxy(new NextRequest(`https://example.com/social/coolapk/${longSlug}`))

    expect(response.status).toBe(301)
    const location = response.headers.get('location') ?? ''
    expect(location.startsWith('/social/coolapk/')).toBe(true)
    const targetSlug = location.slice('/social/coolapk/'.length)
    expect(targetSlug.length).toBeLessThanOrEqual(198)
    expect(targetSlug.endsWith(`--${id}`)).toBe(true)
    expect(getContentStatus).not.toHaveBeenCalled()
  })

  it('returns 404 with noindex for excessively nested multi-encoded slugs without DB lookup', async () => {
    vi.mocked(getContentStatus).mockClear()
    let nested = encodeURIComponent('测试--550e8400-e29b-41d4-a716-446655440000')
    for (let i = 0; i < 25; i += 1) nested = encodeURIComponent(nested)

    const response = await proxy(new NextRequest(`https://example.com/news/baidu/${nested}`))

    expect(response.status).toBe(404)
    expect(response.headers.get('x-robots-tag')).toBe('noindex')
    expect(getContentStatus).not.toHaveBeenCalled()
  })
})
