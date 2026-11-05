import { PgDialect } from 'drizzle-orm/pg-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { app } from '../../../lib/hono-app'

const { read, result } = vi.hoisted(() => ({
  read: vi.fn(),
  result: { data: [] as { id: string; summary: string | null }[], error: null as unknown }
}))
vi.mock('../../../lib/business-db', () => ({ readBusinessRows: read }))
beforeEach(() => {
  read.mockReset()
  result.data = []
  result.error = null
  read.mockImplementation(async () => {
    if (result.error) throw result.error
    return result.data
  })
})
describe('search endpoint', () => {
  it('rejects invalid requests before querying', async () => {
    for (const suffix of ['q=a', 'q=aa&page=-1', 'q=aa&page=1.5', 'q=aa&page=50']) {
      expect((await app.request(new Request(`http://localhost/api/search?${suffix}`))).status).toBe(
        400
      )
    }
    expect(read).not.toHaveBeenCalled()
  })
  it('uses a lookahead row and returns compact match snippets', async () => {
    result.data = Array.from({ length: 21 }, (_, id) => ({
      id: String(id),
      summary: `${'前'.repeat(400)}模型${'后'.repeat(400)}`
    }))
    const response = await app.request(new Request('http://localhost/api/search?q=模型&page=1'))
    const body = await response.json()
    const statement = new PgDialect().sqlToQuery(read.mock.calls[0][0])
    expect(statement.params.slice(-2)).toEqual([21, 20])
    expect(body.items).toHaveLength(20)
    expect(body.hasMore).toBe(true)
    expect(body.items[0].summary).toContain('模型')
    expect(body.items[0].summary.length).toBeLessThan(200)
  })
  it('returns empty results normally and hides database errors', async () => {
    expect(
      await (await app.request(new Request('http://localhost/api/search?q=模型'))).json()
    ).toEqual({
      items: [],
      hasMore: false
    })
    result.error = { message: 'private database details' }
    const response = await app.request(new Request('http://localhost/api/search?q=模型'))
    expect(response.status).toBe(503)
    expect(await response.text()).not.toContain('private')
  })
  it('applies section, source and a stable rolling date range on the server', async () => {
    const response = await app.request(
      '/api/search?q=model&section=/ai&source=openai&range=week&at=2026-09-28T00:00:00Z'
    )
    expect(response.status).toBe(200)
    const statement = new PgDialect().sqlToQuery(read.mock.calls[0][0])
    expect(statement.sql).toMatch(/section=\$\d+/)
    expect(statement.sql).toMatch(/source=\$\d+/)
    expect(statement.params).toContain('ai')
    expect(statement.params).toContain('openai')
    expect(statement.params).toContain('2026-09-21T00:00:00.000Z')
    expect(statement.params).toContain('2026-09-28T00:00:00.000Z')
  })
  it('rejects malformed and mismatched filters before touching the database', async () => {
    for (const suffix of [
      'section=/invalid',
      'section=/ai&source=juejin',
      'source=github',
      'range=month',
      'at=invalid',
      'at=2099-01-01'
    ]) {
      expect((await app.request(`/api/search?q=model&${suffix}`)).status).toBe(400)
    }
    expect(read).not.toHaveBeenCalled()
  })
})
