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
})
