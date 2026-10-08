import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fetchTranslation = vi.fn()
let translateWithAzure: typeof import('./azure-translation').translateWithAzure

function response(text: unknown, to = 'zh-Hans') {
  return Response.json([{ translations: [{ to, text }] }])
}

beforeEach(async () => {
  vi.resetModules()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.stubEnv('AZURE_TRANSLATOR_KEY', 'test-key')
  vi.stubEnv('AZURE_TRANSLATOR_REGION', 'eastasia')
  vi.stubGlobal('fetch', fetchTranslation)
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  fetchTranslation.mockReset().mockResolvedValue(response('中文译文'))
  translateWithAzure = (await import('./azure-translation')).translateWithAzure
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('Azure translation', () => {
  it('sends English to Simplified Chinese with server-only key and region headers', async () => {
    expect(await translateWithAzure('Hello')).toBe('中文译文')
    const [url, init] = fetchTranslation.mock.calls[0]
    expect(url).toBe(
      'https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=zh-Hans&textType=plain'
    )
    expect(init).toMatchObject({
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': 'test-key',
        'Ocp-Apim-Subscription-Region': 'eastasia'
      },
      body: JSON.stringify([{ Text: 'Hello' }]),
      cache: 'no-store'
    })
    expect(init.signal).toBeInstanceOf(AbortSignal)
    expect(init.signal.aborted).toBe(false)
  })

  it.each(['', 'global'])('omits the region header for global resources: %j', async (region) => {
    vi.stubEnv('AZURE_TRANSLATOR_REGION', region)
    await translateWithAzure('Hello')
    expect(fetchTranslation.mock.calls[0][1].headers).not.toHaveProperty(
      'Ocp-Apim-Subscription-Region'
    )
  })

  it('preserves HTML and removes only the transport wrapper', async () => {
    const html = '<p>Read <a href="https://example.com">the guide</a>.</p>'
    const translated = '<p>阅读<a href="https://example.com">指南</a>。</p>'
    fetchTranslation.mockResolvedValue(response(`<div>${translated}</div>`))
    expect(await translateWithAzure(html, true)).toBe(translated)
    const [url, init] = fetchTranslation.mock.calls[0]
    expect(url).toContain('textType=html')
    expect(JSON.parse(init.body)).toEqual([{ Text: `<div>${html}</div>` }])
  })

  it('skips the cloud when no key is configured', async () => {
    vi.stubEnv('AZURE_TRANSLATOR_KEY', '  ')
    expect(await translateWithAzure('Hello')).toBeNull()
    expect(fetchTranslation).not.toHaveBeenCalled()
  })

  it('uses local fallback above the request limit without disabling short requests', async () => {
    expect(await translateWithAzure('a'.repeat(50_001))).toBeNull()
    expect(await translateWithAzure('a'.repeat(49_990), true)).toBeNull()
    expect(fetchTranslation).not.toHaveBeenCalled()
    expect(await translateWithAzure('a'.repeat(50_000))).toBe('中文译文')
  })

  it.each([401, 403, 429, 500])('falls back and cools down after HTTP %i', async (status) => {
    fetchTranslation.mockResolvedValueOnce(new Response('private upstream error', { status }))
    expect(await translateWithAzure('First')).toBeNull()
    expect(await translateWithAzure('Second')).toBeNull()
    expect(fetchTranslation).toHaveBeenCalledTimes(1)
    expect(console.warn).toHaveBeenCalledWith(
      '[translation] Azure unavailable; using local translation for 60 seconds'
    )
    vi.setSystemTime(Date.now() + 60_000)
    expect(await translateWithAzure('Recovered')).toBe('中文译文')
    expect(fetchTranslation).toHaveBeenCalledTimes(2)
  })

  it('falls back on network timeout without logging the upstream error', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout')
    fetchTranslation.mockRejectedValueOnce(new DOMException('private text', 'TimeoutError'))
    expect(await translateWithAzure('Hello')).toBeNull()
    expect(timeout).toHaveBeenCalledWith(20_000)
    expect(console.warn).not.toHaveBeenCalledWith(expect.stringContaining('private text'))
  })

  it.each([
    { payload: null },
    { payload: [] },
    { payload: [{ translations: null }] },
    { payload: [{ translations: [{ to: 'de', text: 'wrong language' }] }] },
    { payload: [{ translations: [{ to: 'zh-Hans', text: 123 }] }] },
    { payload: [{ translations: [{ to: 'zh-Hans', text: '  ' }] }] }
  ])('rejects malformed or missing translations: %j', async ({ payload }) => {
    fetchTranslation.mockResolvedValueOnce(Response.json(payload))
    expect(await translateWithAzure('Hello')).toBeNull()
  })

  it.each(['<p>译文</p>', '<div></div>'])(
    'rejects missing or empty HTML wrappers: %s',
    async (html) => {
      fetchTranslation.mockResolvedValueOnce(response(html))
      expect(await translateWithAzure('<p>Hello</p>', true)).toBeNull()
    }
  )
})
