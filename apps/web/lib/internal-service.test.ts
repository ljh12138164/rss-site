import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DailyReportRepository } from './daily-repository'
import { internalService } from './internal-service'

const rows = vi.hoisted(() => vi.fn())
vi.mock('./business-db', () => ({ readBusinessRows: rows, getBusinessDatabase: vi.fn() }))

describe('internal agent repository boundary', () => {
  beforeEach(() => vi.stubEnv('AGENT_SERVICE_TOKEN', 'test-token'))
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })
  const submit = vi.fn().mockResolvedValue({ status: 'queued' })
  const heartbeat = vi.fn().mockResolvedValue(false)
  const app = () => internalService({ submit, heartbeat } as unknown as DailyReportRepository)
  function request(body: unknown, token = 'test-token') {
    return app().request('/api/internal/agent', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(body)
    })
  }
  it('rejects missing or incorrect service credentials before accessing data', async () => {
    expect((await request({ operation: 'article' }, 'wrong')).status).toBe(401)
    expect(rows).not.toHaveBeenCalled()
    vi.stubEnv('AGENT_SERVICE_TOKEN', '')
    expect((await request({ operation: 'claim' })).status).toBe(401)
  })
  it('permits only bounded operations and validates article/date/lease identifiers', async () => {
    for (const body of [
      { operation: 'sql', query: 'select *' },
      { operation: 'article', id: "x' or true" },
      { operation: 'status', date: '2026-02-30' },
      { operation: 'heartbeat', job: { id: 'bad' } }
    ]) {
      expect((await request(body)).status).toBe(400)
    }
    expect(rows).not.toHaveBeenCalled()
    expect(heartbeat).not.toHaveBeenCalled()
  })
  it('returns only the server-owned article projection', async () => {
    const article = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Article',
      summary: null,
      contentHtml: '<p>Body</p>'
    }
    rows.mockResolvedValueOnce([article])
    expect(await (await request({ operation: 'article', id: article.id })).json()).toEqual({
      result: article
    })
  })
  it('preserves submission options and masks database errors', async () => {
    expect(
      (await request({ operation: 'submit', date: '2026-11-05', trigger: 'manual', retry: true }))
        .status
    ).toBe(200)
    expect(submit).toHaveBeenCalledWith('2026-11-05', true, 'manual')
    submit.mockRejectedValueOnce(new Error('postgresql://private-credentials'))
    const response = await request({ operation: 'submit', date: '2026-11-05', trigger: 'auto' })
    expect(response.status).toBe(503)
    expect(await response.text()).not.toContain('private-credentials')
  })
})
