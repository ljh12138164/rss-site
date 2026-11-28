import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { publishContent } from './content-publication'

const requests: { url: string; init?: RequestInit }[] = []
beforeEach(() => {
  requests.length = 0
  vi.stubEnv('SITE_URL', 'https://news.example')
  vi.stubEnv('CLOUDFLARE_API_TOKEN', 'private-token')
  vi.stubEnv('CLOUDFLARE_ZONE_ID', 'a'.repeat(32))
  vi.stubEnv('INDEXNOW_KEY', 'test-key-12345678')
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    requests.push({ url: String(url), init })
    return String(url).includes('cloudflare.com')
      ? Response.json({ success: true })
      : new Response('', { status: 200 })
  })
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('content publication', () => {
  it('purges exact canonical URLs before warming and indexing, excluding sitemap from indexing', async () => {
    const result = await publishContent(
      ['/', '/sitemap.xml', '/ai', '/ai/openai', '/ai'],
      'batch-1'
    )
    expect(result.cloudflare.status).toBe('succeeded')
    expect(result.indexnow.status).toBe('succeeded')
    expect(JSON.parse(String(requests[0].init?.body))).toEqual({
      files: [
        'https://news.example/',
        'https://news.example/sitemap.xml',
        'https://news.example/ai',
        'https://news.example/ai/openai'
      ]
    })
    expect(requests.slice(1, -1).map((r) => r.url)).toEqual([
      'https://news.example/',
      'https://news.example/sitemap.xml',
      'https://news.example/ai',
      'https://news.example/ai/openai'
    ])
    expect(JSON.parse(String(requests.at(-1)?.init?.body))).toEqual({
      host: 'news.example',
      key: 'test-key-12345678',
      keyLocation: 'https://news.example/indexnow.txt',
      urlList: [
        'https://news.example/',
        'https://news.example/ai',
        'https://news.example/ai/openai'
      ]
    })
    expect(requests.every((r) => r.init?.redirect === 'error')).toBe(true)
    expect(requests.slice(1).every((r) => !JSON.stringify(r.init).includes('private-token'))).toBe(
      true
    )
  })

  it('rejects unsafe or non-public paths before any outbound request', async () => {
    for (const path of [
      '//evil.example',
      'https://evil.example',
      '/ai/../api/search',
      '/ai?x=1',
      '/ai#x',
      '/api/search',
      '/out',
      '/ai/wrong',
      '/ai/openai/third-party-article',
      '/ai/%2e%2e'
    ]) {
      await expect(publishContent([path], 'bad')).rejects.toThrow('Invalid publication path')
    }
    expect(requests).toHaveLength(0)
  })

  it('disables unconfigured integrations without affecting ISR or making requests', async () => {
    vi.stubEnv('CLOUDFLARE_API_TOKEN', '')
    vi.stubEnv('CLOUDFLARE_ZONE_ID', '')
    vi.stubEnv('INDEXNOW_KEY', '')
    const result = await publishContent(['/ai'], 'disabled')
    expect(result.cloudflare.status).toBe('disabled')
    expect(result.prewarm.status).toBe('skipped')
    expect(result.indexnow.status).toBe('disabled')
    expect(requests).toHaveLength(0)
  })

  it('does not warm or notify after a purge rejection and logs no credentials', async () => {
    vi.stubGlobal('fetch', async () => Response.json({ success: false }, { status: 200 }))
    const result = await publishContent(['/ai'], 'failed-purge')
    expect(result.cloudflare.status).toBe('failed')
    expect(result.prewarm.status).toBe('skipped')
    expect(result.indexnow.status).toBe('skipped')
    const log = JSON.stringify(vi.mocked(console.info).mock.calls)
    expect(log).toContain('failed-purge')
    expect(log).not.toContain('private-token')
    expect(log).not.toContain('test-key-12345678')
  })

  it('chunks purge requests and limits sequential prewarming', async () => {
    const paths = Array.from({ length: 65 }, (_, n) => `/ai/events/event-${n}`)
    await publishContent(paths, 'large')
    const purges = requests.filter((r) => r.url.includes('cloudflare.com'))
    expect(purges.map((r) => JSON.parse(String(r.init?.body)).files.length)).toEqual([30, 30, 5])
    expect(requests.filter((r) => r.init?.method === 'GET')).toHaveLength(5)
    expect(JSON.parse(String(requests.at(-1)?.init?.body)).urlList).toHaveLength(65)
  })

  it('retries transient IndexNow errors, accepting 202 without claiming indexing', async () => {
    vi.stubEnv('CLOUDFLARE_API_TOKEN', '')
    vi.stubEnv('CLOUDFLARE_ZONE_ID', '')
    let attempts = 0
    vi.stubGlobal('fetch', async () => new Response('', { status: ++attempts === 1 ? 503 : 202 }))
    const result = await publishContent(['/ai'], 'retry')
    expect(result.indexnow).toMatchObject({ status: 'succeeded', httpStatus: 202, attempts: 2 })
  })

  it('accepts leaderboard paths and pushes only high-value URLs to Baidu without leaking token', async () => {
    vi.stubEnv('CLOUDFLARE_API_TOKEN', '')
    vi.stubEnv('CLOUDFLARE_ZONE_ID', '')
    vi.stubEnv('INDEXNOW_KEY', '')
    vi.stubEnv('BAIDU_PUSH_TOKEN', 'baidu-secret-token-123')

    const result = await publishContent(
      ['/', '/ai', '/daily/2026-11-28', '/leaderboard', '/leaderboard/gpt-6.2-astra'],
      'baidu-high-value'
    )
    expect(result.baidu).toMatchObject({ status: 'succeeded', httpStatus: 200, attempts: 1 })
    expect(requests).toHaveLength(1)
    expect(requests[0].url).toBe(
      'http://data.zz.baidu.com/urls?site=https://news.example&token=baidu-secret-token-123'
    )
    expect(requests[0].init?.body).toBe(
      [
        'https://news.example/daily/2026-11-28',
        'https://news.example/leaderboard',
        'https://news.example/leaderboard/gpt-6.2-astra'
      ].join('\n')
    )
    const log = JSON.stringify(vi.mocked(console.info).mock.calls)
    expect(log).not.toContain('baidu-secret-token-123')
  })

  it('skips Baidu push when batch has no high-value URLs or daily quota is exhausted', async () => {
    vi.stubEnv('CLOUDFLARE_API_TOKEN', '')
    vi.stubEnv('CLOUDFLARE_ZONE_ID', '')
    vi.stubEnv('INDEXNOW_KEY', '')
    vi.stubEnv('BAIDU_PUSH_TOKEN', 'baidu-secret-token-123')

    const skipped = await publishContent(['/', '/ai'], 'baidu-skip')
    expect(skipped.baidu.status).toBe('skipped')
    expect(requests).toHaveLength(0)

    vi.stubGlobal(
      'fetch',
      async () =>
        new Response(JSON.stringify({ error: 400, message: 'over quota' }), { status: 400 })
    )
    const quota = await publishContent(['/daily/2026-11-28'], 'baidu-quota')
    expect(quota.baidu).toMatchObject({ status: 'skipped', httpStatus: 400 })
  })
})
