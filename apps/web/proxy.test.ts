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
})
