import { describe, expect, it, vi } from 'vitest'
import type { RssSectionData } from '@/lib/rss-feed'
import { createRssResponse } from './route'

function sectionData(overrides: Partial<RssSectionData> = {}): RssSectionData {
  return {
    config: {
      id: 'ai',
      title: 'AI',
      description: 'AI 官方动态',
      pagePath: '/ai',
      sources: []
    },
    entries: [],
    lastBuildDate: null,
    unavailable: false,
    ...overrides
  }
}

describe('RSS route', () => {
  it('returns cacheable RSS XML for a known section', async () => {
    const load = vi.fn(async () => sectionData())
    const response = await createRssResponse(
      new Request('https://hot.example/feeds/ai.xml'),
      'ai.xml',
      load
    )

    expect(load).toHaveBeenCalledWith('ai')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/rss+xml; charset=utf-8')
    expect(response.headers.get('cache-control')).toContain('s-maxage=1800')
    expect(await response.text()).toContain('<rss version="2.0"')
  })

  it('returns 404 without querying for an unknown feed', async () => {
    const load = vi.fn(async () => sectionData())
    const response = await createRssResponse(
      new Request('https://hot.example/feeds/unknown.xml'),
      'unknown.xml',
      load
    )

    expect(response.status).toBe(404)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(load).not.toHaveBeenCalled()
  })

  it('returns 503 instead of publishing an outage as an empty feed', async () => {
    const response = await createRssResponse(
      new Request('https://hot.example/feeds/ai.xml'),
      'ai.xml',
      async () => sectionData({ unavailable: true })
    )

    expect(response.status).toBe(503)
    expect(response.headers.get('retry-after')).toBe('300')
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('returns 503 when loading throws unexpectedly', async () => {
    const response = await createRssResponse(
      new Request('https://hot.example/feeds/ai.xml'),
      'ai.xml',
      async () => {
        throw new Error('query failed')
      }
    )

    expect(response.status).toBe(503)
  })
})
