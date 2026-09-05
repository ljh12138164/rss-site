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

  it('runs a confirmed news source through both news and generic endpoints', async () => {
    const sources: string[] = []
    const app = configureApp(new Hono(), {
      cronSecret: 'secret',
      runIngestion: async (source) => {
        sources.push(source)
        return { batchId: 'batch-news', itemCount: 20 }
      }
    })

    for (const path of ['/cron/news/xinhua', '/cron/signals/xinhua']) {
      const response = await app.request(path, {
        method: 'POST',
        headers: { Authorization: 'Bearer secret' }
      })
      expect(response.status).toBe(200)
    }

    expect(sources).toEqual(['xinhua', 'xinhua'])
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

  it('runs a confirmed AI source only through AI and generic endpoints', async () => {
    const sources: string[] = []
    const app = configureApp(new Hono(), {
      cronSecret: 'secret',
      runIngestion: async (source) => {
        sources.push(source)
        return { batchId: 'batch-ai', itemCount: 20 }
      }
    })

    for (const path of ['/cron/ai/openai', '/cron/signals/openai']) {
      expect(
        (
          await app.request(path, {
            method: 'POST',
            headers: { Authorization: 'Bearer secret' }
          })
        ).status
      ).toBe(200)
    }

    const wrongSection = await app.request('/cron/news/openai', {
      method: 'POST',
      headers: { Authorization: 'Bearer secret' }
    })
    expect(wrongSection.status).toBe(404)
    expect(sources).toEqual(['openai', 'openai'])
  })

  it('runs a confirmed social source only through social and generic endpoints', async () => {
    const sources: string[] = []
    const app = configureApp(new Hono(), {
      cronSecret: 'secret',
      runIngestion: async (source) => {
        sources.push(source)
        return { batchId: 'batch-social', itemCount: 20 }
      }
    })

    for (const path of ['/cron/social/bilibili', '/cron/signals/bilibili']) {
      expect(
        (
          await app.request(path, {
            method: 'POST',
            headers: { Authorization: 'Bearer secret' }
          })
        ).status
      ).toBe(200)
    }

    const wrongSection = await app.request('/cron/news/bilibili', {
      method: 'POST',
      headers: { Authorization: 'Bearer secret' }
    })
    expect(wrongSection.status).toBe(404)
    expect(sources).toEqual(['bilibili', 'bilibili'])
  })

  it('runs a confirmed finance source only through finance and generic endpoints', async () => {
    const sources: string[] = []
    const app = configureApp(new Hono(), {
      cronSecret: 'secret',
      runIngestion: async (source) => {
        sources.push(source)
        return { batchId: 'batch-finance', itemCount: 20 }
      }
    })

    for (const path of ['/cron/finance/wallstreetcn', '/cron/signals/wallstreetcn']) {
      expect(
        (
          await app.request(path, {
            method: 'POST',
            headers: { Authorization: 'Bearer secret' }
          })
        ).status
      ).toBe(200)
    }

    const wrongSection = await app.request('/cron/news/wallstreetcn', {
      method: 'POST',
      headers: { Authorization: 'Bearer secret' }
    })
    expect(wrongSection.status).toBe(404)
    expect(sources).toEqual(['wallstreetcn', 'wallstreetcn'])
  })

  it('runs a confirmed game source only through games and generic endpoints', async () => {
    const sources: string[] = []
    const app = configureApp(new Hono(), {
      cronSecret: 'secret',
      runIngestion: async (source) => {
        sources.push(source)
        return { batchId: 'batch-games', itemCount: 20 }
      }
    })

    for (const path of ['/cron/games/steam', '/cron/signals/steam']) {
      expect(
        (
          await app.request(path, {
            method: 'POST',
            headers: { Authorization: 'Bearer secret' }
          })
        ).status
      ).toBe(200)
    }

    const wrongSection = await app.request('/cron/news/steam', {
      method: 'POST',
      headers: { Authorization: 'Bearer secret' }
    })
    expect(wrongSection.status).toBe(404)
    expect(sources).toEqual(['steam', 'steam'])
  })

  it('keeps the legacy Juejin endpoint during the Cron transition', async () => {
    const sources: string[] = []
    const app = configureApp(new Hono(), {
      cronSecret: 'secret',
      runIngestion: async (source) => {
        sources.push(source)
        return { batchId: 'batch-1', itemCount: 12 }
      }
    })

    const response = await app.request('/cron/juejin', {
      method: 'POST',
      headers: { Authorization: 'Bearer secret' }
    })

    expect(response.status).toBe(200)
    expect(sources).toEqual(['juejin'])
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
