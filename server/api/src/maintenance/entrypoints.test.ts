import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { configureApp } from '../http-app.js'
import worker from '../index.js'
import { refreshCookieFromRuntime } from './runtime.js'
import { RefreshError } from './zhihu.js'

vi.mock('./runtime.js', () => ({ refreshCookieFromRuntime: vi.fn() }))

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

  const env: Env = {
    HYPERDRIVE: {
      ip: '240.0.0.1',
      connect() {
        throw new Error('Database not used in entrypoint tests')
      },
      connectionString: 'postgres://synthetic',
      host: 'localhost',
      port: 5432,
      database: 'test',
      user: 'test',
      password: 'synthetic'
    },
    CRON_SECRET: 'synthetic',
    REVALIDATE_SECRET: 'synthetic',
    RSSHUB_BASE_URL: 'https://rss.example.com',
    WEB_APP_URL: 'https://news.example.com',
    ZHIHU_COOKIES: 'z_c0=synthetic',
    VERCEL_API_TOKEN: 'synthetic',
    RSSHUB_VERCEL_PROJECT_ID: 'prj_test',
    RSSHUB_VERCEL_TEAM_ID: 'team_test',
    ZHIHU_REFRESH_ENABLED: 'true'
  }
  const controller: ScheduledController = {
    cron: '0 20 * * *',
    scheduledTime: 1700000000000,
    noRetry() {}
  }

  it('does no work when native Cron is disabled', async () => {
    await worker.scheduled(controller, { ...env, ZHIHU_REFRESH_ENABLED: 'false' })
    expect(refreshCookieFromRuntime).not.toHaveBeenCalled()
  })

  it('runs the shared refresh task from native Cron', async () => {
    vi.mocked(refreshCookieFromRuntime).mockResolvedValue({ status: 'unchanged' })
    const log = vi.spyOn(console, 'info').mockImplementation(() => {})
    try {
      await worker.scheduled(controller, env)
      expect(refreshCookieFromRuntime).toHaveBeenCalledWith(
        expect.objectContaining({
          zhihuCookie: 'z_c0=synthetic',
          databaseUrl: 'postgres://synthetic'
        })
      )
      expect(log.mock.calls.flat().join(' ')).not.toContain('z_c0=')
    } finally {
      log.mockRestore()
    }
  })

  it('records native Cron failure without leaking the original error', async () => {
    vi.mocked(refreshCookieFromRuntime).mockRejectedValue(new RefreshError('upstream_http_403'))
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      await expect(worker.scheduled(controller, env)).rejects.toThrow(
        'zhihu-cookie-refresh: upstream_http_403'
      )
      expect(log.mock.calls.flat().join(' ')).not.toContain('synthetic')
    } finally {
      log.mockRestore()
    }
  })
})
