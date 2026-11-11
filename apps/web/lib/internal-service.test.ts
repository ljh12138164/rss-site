import { PgDialect } from 'drizzle-orm/pg-core'
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
  const generation = {
    operation: 'recordHotRankingGeneration',
    batchId: '550e8400-e29b-41d4-a716-446655440000',
    articleIds: ['550e8400-e29b-41d4-a716-446655440001'],
    phase: 'analysis',
    model: 'gemini-3.5-flash-lite',
    startedAt: '2026-11-11T01:00:00.000Z',
    elapsedMs: 30,
    status: 'recovered',
    issueCode: 'new_group',
    result: '{"groupKey":null}',
    resultTruncated: false
  }
  it('stores the original model reply and issue as parameters through the authenticated write-only operation', async () => {
    expect((await request(generation, 'wrong')).status).toBe(401)
    expect(rows).not.toHaveBeenCalled()
    rows.mockResolvedValueOnce([])
    expect(await (await request(generation)).json()).toEqual({ result: true })
    const query = new PgDialect().sqlToQuery(rows.mock.calls[0][0])
    expect(query.sql).toContain('insert into private.hot_ranking_generations')
    expect(query.sql).not.toContain(generation.result)
    expect(query.params).toEqual([
      generation.batchId,
      generation.phase,
      generation.articleIds[0],
      generation.model,
      generation.startedAt,
      generation.elapsedMs,
      generation.status,
      generation.issueCode,
      generation.result,
      generation.resultTruncated
    ])
  })
  it('rejects inconsistent generation records and oversized replies before touching the database', async () => {
    for (const overrides of [
      { phase: 'publish' },
      { batchId: 'invalid' },
      { articleIds: [] },
      { status: 'ok' },
      { issueCode: null },
      { result: null },
      { result: '文'.repeat(10923) },
      { result: '\0' },
      { elapsedMs: -1 }
    ])
      expect((await request({ ...generation, ...overrides })).status).toBe(400)
    expect(rows).not.toHaveBeenCalled()
  })
  it('records upstream failures even when no model reply exists', async () => {
    rows.mockResolvedValueOnce([])
    expect(
      (await request({ ...generation, status: 'failed', issueCode: 'upstream_429', result: null }))
        .status
    ).toBe(200)
    const query = new PgDialect().sqlToQuery(rows.mock.calls[0][0])
    expect(query.params.slice(-4)).toEqual(['failed', 'upstream_429', null, false])
  })
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
