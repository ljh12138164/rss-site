import { afterEach, describe, expect, it, vi } from 'vitest'
import relay from '../../../../deploy/feed-relay/index'

afterEach(() => vi.unstubAllGlobals())

describe('fixed feed relay', () => {
  it.each(['/google-ai?url=https://evil.test', '/unknown', '/constructor', '/google-ai/'])(
    'rejects non-configured targets: %s',
    async (path) => {
      const fetcher = vi.fn()
      vi.stubGlobal('fetch', fetcher)
      expect((await relay.fetch(new Request(`https://relay.test${path}`))).status).toBe(404)
      expect(fetcher).not.toHaveBeenCalled()
    }
  )

  it('forwards the original feed without client credentials or redirects', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response('<feed>original content</feed>', {
        headers: { 'Content-Type': 'application/atom+xml', 'Set-Cookie': 'upstream=cookie' }
      })
    )
    vi.stubGlobal('fetch', fetcher)
    const response = await relay.fetch(
      new Request('https://relay.test/simon-willison', {
        headers: { Authorization: 'Bearer client-secret', Cookie: 'client=cookie' }
      })
    )
    expect(await response.text()).toBe('<feed>original content</feed>')
    expect(response.headers.get('Set-Cookie')).toBeNull()
    const [target, options] = fetcher.mock.calls[0]
    expect(target).toBe('https://simonwillison.net/atom/entries/')
    expect(options.redirect).toBe('manual')
    expect(new Headers(options.headers).has('Authorization')).toBe(false)
    expect(new Headers(options.headers).has('Cookie')).toBe(false)
  })

  it('returns failure when the upstream fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('upstream details', { status: 503 }))
    )
    const response = await relay.fetch(new Request('https://relay.test/google-ai'))
    expect(response.status).toBe(502)
    expect(await response.text()).not.toContain('upstream details')
  })

  it('rejects an upstream redirect without following it', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(null, { status: 302, headers: { Location: 'https://evil.test/' } })
      )
    vi.stubGlobal('fetch', fetcher)
    expect((await relay.fetch(new Request('https://relay.test/google-ai'))).status).toBe(502)
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fetcher.mock.calls[0][1].redirect).toBe('manual')
  })

  it('rejects writes', async () => {
    expect(
      (await relay.fetch(new Request('https://relay.test/google-ai', { method: 'POST' }))).status
    ).toBe(405)
  })
})
