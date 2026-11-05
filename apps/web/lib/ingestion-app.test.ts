import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ingestionApp } from './ingestion-app'

const { verify, ingest } = vi.hoisted(() => ({ verify: vi.fn(), ingest: vi.fn() }))
vi.mock('./business-db', () => ({ getBusinessDatabase: () => ({ client: {}, db: {} }) }))
vi.mock('../../../server/api/src/ingestion/pipeline', () => ({ runIngestionPipeline: ingest }))
vi.mock('./business-maintenance', () => ({
  drainPublicationOutbox: vi.fn(),
  refreshBusinessCookie: vi.fn(),
  retainBusinessData: vi.fn()
}))
vi.mock('../../../server/api/src/setup/postgres-repository', () => ({
  PostgresCronRepository: class {
    verifyIngestion = verify
  }
}))

describe('production ingestion acceptance endpoint', () => {
  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', 'test-cron')
    vi.resetAllMocks()
  })
  afterEach(() => vi.unstubAllEnvs())
  function request(source: string, body: unknown, token = 'test-cron') {
    return ingestionApp().request(`/cron/verify/${source}`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify(body)
    })
  }
  const body = { batchId: '550e8400-e29b-41d4-a716-446655440000', itemCount: 12 }
  it('publishes ingestion changes to the local Next server without traversing the public CDN', async () => {
    vi.stubEnv('PORT', '3000')
    ingest.mockResolvedValue({ ...body, source: 'openai' })
    const response = await ingestionApp().request('/cron/signals/openai', {
      method: 'POST',
      headers: { authorization: 'Bearer test-cron' }
    })
    expect(response.status).toBe(200)
    expect(ingest).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'openai' }),
      expect.objectContaining({ webAppUrl: 'http://127.0.0.1:3000' })
    )
  })
  it('requires the existing Cron secret before accessing the business database', async () => {
    expect((await request('openai', body, 'wrong')).status).toBe(401)
    expect(verify).not.toHaveBeenCalled()
  })
  it('validates registered sources, batch IDs and counts before the SQL check', async () => {
    for (const [source, input] of [
      ['unknown', body],
      ['openai', { ...body, batchId: 'invalid' }],
      ['openai', { ...body, itemCount: 0 }]
    ] as const)
      expect((await request(source, input)).status).toBe(400)
    expect(verify).not.toHaveBeenCalled()
  })
  it('returns acceptance only when the target PostgreSQL check passes', async () => {
    verify.mockResolvedValueOnce(undefined)
    expect(await (await request('openai', body)).json()).toEqual({
      verified: true,
      databaseMajor: 18
    })
    expect(verify).toHaveBeenCalledWith({ ...body, source: 'openai', section: 'ai' })
    verify.mockRejectedValueOnce(new Error('private database details'))
    const failed = await request('openai', body)
    expect(failed.status).toBe(503)
    expect(await failed.text()).not.toContain('private database details')
  })
})
