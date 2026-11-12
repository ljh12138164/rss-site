import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { configureApp } from './http-app.js'

describe('Hono ingestion API', () => {
  it.each([undefined, 'Bearer wrong', 'secret'])(
    'rejects an invalid Authorization header',
    async (authorization) => {
      const app = configureApp(new Hono(), {
        cronSecret: 'secret',
        runIngestion: async () => ({ batchId: '1', itemCount: 2 })
      })
      const headers = authorization ? { Authorization: authorization } : undefined

      const response = await app.request('/cron/technology/github', { method: 'POST', headers })

      expect(response.status).toBe(401)
      expect(await response.json()).toEqual({ error: 'Unauthorized' })
    }
  )

  it('runs an authenticated ingestion for the requested source', async () => {
    const sources: string[] = []
    const app = configureApp(new Hono(), {
      cronSecret: 'secret',
      runIngestion: async (source) => {
        sources.push(source)
        return { batchId: 'batch-1', itemCount: 30 }
      }
    })

    const response = await app.request('/cron/technology/github', {
      method: 'POST',
      headers: { Authorization: 'Bearer secret' }
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ batchId: 'batch-1', itemCount: 30 })
    expect(sources).toEqual(['github'])
  })

  it('does not accept a news source through the legacy technology endpoint', async () => {
    const app = configureApp(new Hono(), {
      cronSecret: 'secret',
      runIngestion: async () => ({ batchId: 'batch-news', itemCount: 20 })
    })

    const response = await app.request('/cron/technology/xinhua', {
      method: 'POST',
      headers: { Authorization: 'Bearer secret' }
    })

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Unknown signal source' })
  })

  it('rejects unknown sources after authentication', async () => {
    const app = configureApp(new Hono(), {
      cronSecret: 'secret',
      runIngestion: async () => ({ batchId: 'batch-1', itemCount: 0 })
    })

    const response = await app.request('/cron/technology/product-hunt', {
      method: 'POST',
      headers: { Authorization: 'Bearer secret' }
    })

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Unknown signal source' })
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
    expect(await response.json()).toEqual({ error: 'Signal ingestion failed' })
  })
})
