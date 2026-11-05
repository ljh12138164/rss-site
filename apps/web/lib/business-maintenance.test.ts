import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  decryptCookieState,
  drainPublicationOutbox,
  encryptCookieState
} from './business-maintenance'

const { query, publish } = vi.hoisted(() => ({ query: vi.fn(), publish: vi.fn() }))
vi.mock('./business-db', () => ({
  getBusinessDatabase: () => ({
    client: { begin: async (action: (sql: typeof query) => unknown) => action(query) }
  })
}))

vi.mock('./content-update', () => ({ updateContent: publish }))
describe('migrated Cookie state encryption', () => {
  afterEach(() => vi.unstubAllEnvs())
  it('authenticates encrypted state and preserves pending deployment recovery', () => {
    vi.stubEnv('MAINTENANCE_ENCRYPTION_KEY', Buffer.alloc(32, 7).toString('base64'))
    const state = {
      cookie: 'z_c0=private-cookie',
      candidate: 'rotated-cookie',
      publishPending: true,
      deploymentId: 'pending'
    }
    const encrypted = encryptCookieState(state)
    expect(encrypted).not.toContain('private-cookie')
    expect(decryptCookieState(encrypted)).toEqual(state)
    const tampered = Buffer.from(encrypted, 'base64')
    tampered[30] ^= 1
    expect(() => decryptCookieState(tampered.toString('base64'))).toThrow()
    vi.stubEnv('MAINTENANCE_ENCRYPTION_KEY', Buffer.alloc(32, 8).toString('base64'))
    expect(() => decryptCookieState(encrypted)).toThrow()
  })
})

describe('durable deletion publication outbox', () => {
  beforeEach(() => vi.resetAllMocks())
  const row = {
    id: '11111111-1111-4111-8111-111111111111',
    payload: {
      section: 'ai',
      source: 'openai',
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Deleted article'
    }
  }
  function statements() {
    return query.mock.calls.map((call) => String.raw(call[0]))
  }
  it('acknowledges a row only after cache invalidation and publication succeed', async () => {
    query.mockResolvedValueOnce([row]).mockResolvedValue([])
    publish.mockResolvedValue({ cacheInvalidated: true, publicationAccepted: true })
    expect(await drainPublicationOutbox()).toEqual({ processed: 1, accepted: 1 })
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({ publicationId: row.id, durablePublication: true })
    )
    expect(statements().some((sql) => sql.startsWith('delete from'))).toBe(true)
    expect(statements().some((sql) => sql.startsWith('update private'))).toBe(false)
  })
  it.each([
    { cacheInvalidated: false, publicationAccepted: true },
    { cacheInvalidated: true, publicationAccepted: false }
  ])('retains failed delivery for retry: %j', async (result) => {
    query.mockResolvedValueOnce([row]).mockResolvedValue([])
    publish.mockResolvedValue(result)
    expect(await drainPublicationOutbox()).toEqual({ processed: 1, accepted: 0 })
    expect(statements().some((sql) => sql.startsWith('delete from'))).toBe(false)
    expect(statements().some((sql) => sql.includes("interval '5 minutes'"))).toBe(true)
  })
  it('retries a thrown publication failure while completing another queued delivery', async () => {
    query
      .mockResolvedValueOnce([row, { ...row, id: '22222222-2222-4222-8222-222222222222' }])
      .mockResolvedValue([])
    publish
      .mockRejectedValueOnce(new Error('publisher unavailable'))
      .mockResolvedValue({ cacheInvalidated: true, publicationAccepted: true })
    expect(await drainPublicationOutbox()).toEqual({ processed: 2, accepted: 1 })
    expect(statements().filter((sql) => sql.startsWith('delete from'))).toHaveLength(1)
    expect(statements().filter((sql) => sql.startsWith('update private'))).toHaveLength(1)
  })
})
