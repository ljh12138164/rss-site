import { NextRequest } from 'next/server'
import { describe, expect, it, vi } from 'vitest'
import { getContentStatus } from './lib/content-status'
import { proxy } from './proxy'

vi.mock('./lib/content-status', () => ({ getContentStatus: vi.fn() }))

describe('technology source proxy', () => {
  it.each([
    ['ai', 'openai'],
    ['technology', 'juejin'],
    ['news', 'xinhua'],
    ['social', 'hupu'],
    ['finance', 'yicai'],
    ['games', 'gcores']
  ])('checks article visibility in %s before streaming', async (section, source) => {
    vi.mocked(getContentStatus).mockResolvedValueOnce(200)
    const id = '550e8400-e29b-41d4-a716-446655440000'
    const response = await proxy(
      new NextRequest(`https://example.com/${section}/${source}/story--${id}`)
    )
    expect(getContentStatus).toHaveBeenLastCalledWith('news', id, source)
    expect(response.headers.get('x-middleware-next')).toBe('1')
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

  it('continues routing for a supported source', async () => {
    const response = await proxy(new NextRequest('https://example.com/technology/github'))

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-next')).toBe('1')
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

  it('accepts only confirmed AI sources on AI routes', async () => {
    const known = await proxy(new NextRequest('https://example.com/ai/openai'))
    const wrongSection = await proxy(new NextRequest('https://example.com/ai/github'))

    expect(known.headers.get('x-middleware-next')).toBe('1')
    expect(wrongSection.status).toBe(404)
  })

  it('accepts only confirmed social sources on social routes', async () => {
    const known = await proxy(new NextRequest('https://example.com/social/bilibili'))
    const wrongSection = await proxy(new NextRequest('https://example.com/social/github'))

    expect(known.headers.get('x-middleware-next')).toBe('1')
    expect(wrongSection.status).toBe(404)
  })

  it('accepts only confirmed finance sources on finance routes', async () => {
    const known = await proxy(new NextRequest('https://example.com/finance/wallstreetcn'))
    const wrongSection = await proxy(new NextRequest('https://example.com/finance/github'))

    expect(known.headers.get('x-middleware-next')).toBe('1')
    expect(wrongSection.status).toBe(404)
  })

  it('accepts only confirmed game sources on game routes', async () => {
    const known = await proxy(new NextRequest('https://example.com/games/steam'))
    const wrongSection = await proxy(new NextRequest('https://example.com/games/github'))

    expect(known.headers.get('x-middleware-next')).toBe('1')
    expect(wrongSection.status).toBe(404)
  })
})
