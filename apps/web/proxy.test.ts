import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import { proxy } from './proxy'

describe('technology source proxy', () => {
  it('continues routing for a supported source', () => {
    const response = proxy(new NextRequest('https://example.com/technology/github'))

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-next')).toBe('1')
  })

  it('rewrites an unsupported source to the 404 page with a 404 status', () => {
    const response = proxy(new NextRequest('https://example.com/technology/nope'))

    expect(response.status).toBe(404)
    expect(response.headers.get('x-middleware-rewrite')).toBe('https://example.com/404')
  })

  it('accepts only confirmed news sources on news routes', () => {
    const known = proxy(new NextRequest('https://example.com/news/xinhua'))
    const wrongSection = proxy(new NextRequest('https://example.com/news/github'))

    expect(known.headers.get('x-middleware-next')).toBe('1')
    expect(wrongSection.status).toBe(404)
  })

  it('accepts only confirmed AI sources on AI routes', () => {
    const known = proxy(new NextRequest('https://example.com/ai/openai'))
    const wrongSection = proxy(new NextRequest('https://example.com/ai/github'))

    expect(known.headers.get('x-middleware-next')).toBe('1')
    expect(wrongSection.status).toBe(404)
  })

  it('accepts only confirmed social sources on social routes', () => {
    const known = proxy(new NextRequest('https://example.com/social/bilibili'))
    const wrongSection = proxy(new NextRequest('https://example.com/social/github'))

    expect(known.headers.get('x-middleware-next')).toBe('1')
    expect(wrongSection.status).toBe(404)
  })

  it('accepts only confirmed finance sources on finance routes', () => {
    const known = proxy(new NextRequest('https://example.com/finance/wallstreetcn'))
    const wrongSection = proxy(new NextRequest('https://example.com/finance/github'))

    expect(known.headers.get('x-middleware-next')).toBe('1')
    expect(wrongSection.status).toBe(404)
  })

  it('accepts only confirmed game sources on game routes', () => {
    const known = proxy(new NextRequest('https://example.com/games/steam'))
    const wrongSection = proxy(new NextRequest('https://example.com/games/github'))

    expect(known.headers.get('x-middleware-next')).toBe('1')
    expect(wrongSection.status).toBe(404)
  })
})
