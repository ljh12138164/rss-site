import { afterEach, expect, it, vi } from 'vitest'
import { app } from './hono-app'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

it.each([
  ['articles', '550e8400-e29b-41d4-a716-446655440000', 'article'],
  ['skills', 'owner/sample', 'skill']
])(
  'forwards %s stream chunks immediately with a server-only token and preserves cancellation',
  async (route, id, kind) => {
    vi.stubEnv('AGENT_SERVICE_URL', 'http://localhost:3001')
    vi.stubEnv('AGENT_SERVICE_TOKEN', 'server-token')
    let controller!: ReadableStreamDefaultController<Uint8Array>
    const cancel = vi.fn()
    const body = new ReadableStream<Uint8Array>({
      start(value) {
        controller = value
      },
      cancel
    })
    const fetcher = vi.fn(
      async () => new Response(body, { headers: { 'content-type': 'application/x-ndjson' } })
    )
    vi.stubGlobal('fetch', fetcher)
    const response = await app.request(`/api/${route}/summarize`, {
      method: 'POST',
      headers: { accept: 'application/x-ndjson', 'content-type': 'application/json' },
      body: JSON.stringify({ id })
    })
    expect(fetcher).toHaveBeenCalledWith(
      `http://localhost:3001/v1/agents/${kind}-summary/invoke`,
      expect.objectContaining({
        headers: {
          authorization: 'Bearer server-token',
          'content-type': 'application/json',
          accept: 'application/x-ndjson'
        },
        body: JSON.stringify({ id }),
        cache: 'no-store',
        signal: expect.any(AbortSignal)
      })
    )
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('x-accel-buffering')).toBe('no')
    expect(response.headers.has('authorization')).toBe(false)
    if (!response.body) throw new Error('Missing response stream')
    const reader = response.body.getReader()
    const draft = '{"type":"partial","summary":{"overview":"文章","keyPoints":[]}}\n'
    controller.enqueue(new TextEncoder().encode(draft))
    expect(new TextDecoder().decode((await reader.read()).value)).toBe(draft)
    await reader.cancel()
    expect(cancel).toHaveBeenCalledTimes(1)
  }
)

it('rejects streaming caller text before contacting the agent', async () => {
  const fetcher = vi.fn()
  vi.stubGlobal('fetch', fetcher)
  const response = await app.request('/api/articles/summarize', {
    method: 'POST',
    headers: { accept: 'application/x-ndjson', 'content-type': 'application/json' },
    body: JSON.stringify({ id: '550e8400-e29b-41d4-a716-446655440000', content: 'injected' })
  })
  expect(response.status).toBe(400)
  expect(fetcher).not.toHaveBeenCalled()
})
