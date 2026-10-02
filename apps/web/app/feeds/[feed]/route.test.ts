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
  it('loads a single platform and a cross-section selection using validated source IDs', async () => {
    const load = vi.fn(async () => sectionData())
    const selected = vi.fn(async () => sectionData())
    expect(
      (
        await createRssResponse(
          new Request('https://hot.example/feeds/openai.xml'),
          'openai.xml',
          load,
          selected
        )
      ).status
    ).toBe(200)
    expect(selected).toHaveBeenLastCalledWith(['openai'])
    expect(
      (
        await createRssResponse(
          new Request('https://hot.example/feeds/custom.xml?sources=openai,juejin,openai'),
          'custom.xml',
          load,
          selected
        )
      ).status
    ).toBe(200)
    expect(selected).toHaveBeenLastCalledWith(['juejin', 'openai'])
    expect(load).not.toHaveBeenCalled()
  })
  it('rejects empty or unsafe custom subscriptions without querying and does not cache outages', async () => {
    const load = vi.fn(async () => sectionData())
    const selected = vi.fn(async () => sectionData({ unavailable: true }))
    for (const ids of ['', 'invalid', 'github', 'openai,https://attacker.example']) {
      expect(
        (
          await createRssResponse(
            new Request(`https://hot.example/feeds/custom.xml?sources=${ids}`),
            'custom.xml',
            load,
            selected
          )
        ).status
      ).toBe(400)
    }
    expect(selected).not.toHaveBeenCalled()
    const unavailable = await createRssResponse(
      new Request('https://hot.example/feeds/openai.xml'),
      'openai.xml',
      load,
      selected
    )
    expect(unavailable.status).toBe(503)
    expect(unavailable.headers.get('Cache-Control')).toBe('no-store')
  })
})
