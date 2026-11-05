import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { configureApp } from '../http-app.js'

describe('Zhihu maintenance entrypoints', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([undefined, 'Bearer wrong'])(
    'rejects manual calls with authorization %s',
    async (authorization) => {
      const refresh = vi.fn()
      const app = configureApp(new Hono(), {
        cronSecret: 'secret',
        runIngestion: vi.fn(),
        refreshZhihuCookie: refresh
      })
      const response = await app.request('/cron/maintenance/zhihu-cookie', {
        method: 'POST',
        headers: authorization ? { Authorization: authorization } : {}
      })
      expect(response.status).toBe(401)
      expect(refresh).not.toHaveBeenCalled()
    }
  )

  it('returns pending until a deployment is verified', async () => {
    const app = configureApp(new Hono(), {
      cronSecret: 'secret',
      runIngestion: vi.fn(),
      refreshZhihuCookie: async () => ({ status: 'deployment_pending', deploymentId: 'dpl_1' })
    })
    const response = await app.request('/cron/maintenance/zhihu-cookie', {
      method: 'POST',
      headers: { Authorization: 'Bearer secret' }
    })
    expect(response.status).toBe(202)
    expect(await response.json()).toEqual({ status: 'deployment_pending', deploymentId: 'dpl_1' })
  })

  it('never exposes an upstream error message or credential', async () => {
    const app = configureApp(new Hono(), {
      cronSecret: 'secret',
      runIngestion: vi.fn(),
      refreshZhihuCookie: async () => {
        throw new Error('sensitive-upstream-response')
      }
    })
    const response = await app.request('/cron/maintenance/zhihu-cookie', {
      method: 'POST',
      headers: { Authorization: 'Bearer secret' }
    })
    expect(response.status).toBe(502)
    expect(await response.text()).not.toContain('sensitive-upstream-response')
  })
})
