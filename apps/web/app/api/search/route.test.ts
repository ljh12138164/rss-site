import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'

const { client, result } = vi.hoisted(() => {
  const result = { data: [] as { id: string; summary: string | null }[], error: null as unknown }
  const client = {
    from: vi.fn(),
    select: vi.fn(),
    or: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    abortSignal: vi.fn()
  }
  return { client, result }
})
vi.mock('../../../lib/supabase', () => ({ getPublicSupabaseClient: () => client }))

beforeEach(() => {
  vi.clearAllMocks()
  for (const method of ['from', 'select', 'or', 'order', 'range'] as const)
    client[method].mockReturnValue(client)
  client.abortSignal.mockImplementation(async () => result)
  result.data = []
  result.error = null
})

describe('search endpoint', () => {
  it('rejects invalid requests before querying', async () => {
    for (const suffix of ['q=a', 'q=aa&page=-1', 'q=aa&page=1.5', 'q=aa&page=50']) {
      expect((await GET(new Request(`http://localhost/api/search?${suffix}`))).status).toBe(400)
    }
    expect(client.from).not.toHaveBeenCalled()
  })
  it('uses a lookahead row and returns compact match snippets', async () => {
    result.data = Array.from({ length: 21 }, (_, id) => ({
      id: String(id),
      summary: `${'前'.repeat(400)}模型${'后'.repeat(400)}`
    }))
    const response = await GET(new Request('http://localhost/api/search?q=模型&page=1'))
    const body = await response.json()
    expect(client.range).toHaveBeenCalledWith(20, 40)
    expect(body.items).toHaveLength(20)
    expect(body.hasMore).toBe(true)
    expect(body.items[0].summary).toContain('模型')
    expect(body.items[0].summary.length).toBeLessThan(200)
  })
  it('returns empty results normally and hides database errors', async () => {
    expect(await (await GET(new Request('http://localhost/api/search?q=模型'))).json()).toEqual({
      items: [],
      hasMore: false
    })
    result.error = { message: 'private database details' }
    const response = await GET(new Request('http://localhost/api/search?q=模型'))
    expect(response.status).toBe(503)
    expect(await response.text()).not.toContain('private')
  })
})
