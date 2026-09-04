import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { configureApp } from './http-app.js'

describe('Hono ingestion API', () => {
  it('reports health without exposing configuration', async () => {
    const app = configureApp(new Hono(), {
      cronSecret: 'secret',
      runIngestion: async () => ({ batchId: '1', itemCount: 2 })
    })

    const response = await app.request('/health')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'ok' })
  })

  it.each([undefined, 'Bearer wrong', 'secret'])(
    'rejects an invalid Authorization header',
    async (authorization) => {
      const app = configureApp(new Hono(), {
        cronSecret: 'secret',
        runIngestion: async () => ({ batchId: '1', itemCount: 2 })
      })
      const headers = authorization ? { Authorization: authorization } : undefined

      const response = await app.request('/cron/juejin', { method: 'POST', headers })

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    }
  )

  it('runs an authenticated ingestion', async () => {
    const app = configureApp(new Hono(), {
      cronSecret: 'secret',
      runIngestion: async () => ({ batchId: 'batch-1', itemCount: 30 })
    })

    const response = await app.request('/cron/juejin', {
      method: 'POST',
      headers: { Authorization: 'Bearer secret' }
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ batchId: 'batch-1', itemCount: 30 })
  })

  it('returns a stable upstream error without leaking internals', async () => {
    const app = configureApp(new Hono(), {
      cronSecret: 'secret',
      runIngestion: async () => {
        throw new Error('database password was rejected')
      }
    })

    const response = await app.request('/cron/juejin', {
      method: 'POST',
      headers: { Authorization: 'Bearer secret' }
    })

    expect(response.status).toBe(502)
    expect(await response.json()).toEqual({ error: 'Juejin ingestion failed' })
  })
})
