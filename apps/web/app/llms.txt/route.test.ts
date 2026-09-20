import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('llms.txt', () => {
  it('publishes absolute discovery and RSS links for the configured site', async () => {
    vi.stubEnv('SITE_URL', 'https://news.ljhboard.cn')

    const response = await GET()
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/plain')
    expect(body).toContain('# 今日热点')
    expect(body).toContain('https://news.ljhboard.cn/ai')
    expect(body).toContain('https://news.ljhboard.cn/ai/events')
    expect(body).toContain('https://news.ljhboard.cn/about')
    expect(body).toContain('https://news.ljhboard.cn/feeds/ai.xml')
    expect(body).toContain('https://news.ljhboard.cn/feeds/news.xml')
  })

  it('returns 404 instead of publishing incorrect local URLs without SITE_URL', async () => {
    vi.stubEnv('SITE_URL', '')

    const response = await GET()

    expect(response.status).toBe(404)
    expect(response.headers.get('cache-control')).toBe('no-store')
  })
})
