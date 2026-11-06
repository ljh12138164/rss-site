import { getSignalSource } from '@rss-site/signals'
import { describe, expect, it, vi } from 'vitest'
import { normalizeIngestUrl, SIGNAL_CRON_JOBS, setupSignalCron } from './cron'

const batchId = '12345678-1234-4234-8234-123456789abc'
const result = () => Response.json({ batchId, itemCount: 12 })

describe('normalizeIngestUrl', () => {
  it('allows protected server operations to use the production loopback endpoint', () => {
    expect(normalizeIngestUrl('http://127.0.0.1:18104')).toBe('http://127.0.0.1:18104/cron/signals')
  })
  it.each(['', '/cron/technology/', '/cron/signals/'])(
    'normalizes the deployed Next address %s',
    (path) => {
      expect(normalizeIngestUrl(`https://news.example.com${path}`)).toBe(
        'https://news.example.com/cron/signals'
      )
    }
  )
  it.each([
    'http://example.com',
    'https://user:pass@example.com',
    'not-a-url',
    'https://example.com?token=private',
    'https://example.com/api/unknown'
  ])('rejects an unsafe address %s', (value) => expect(() => normalizeIngestUrl(value)).toThrow())
})

describe('ECS source acceptance gate', () => {
  it('validates every registered source before returning acceptance evidence', async () => {
    const calls: string[] = []
    const verified = await setupSignalCron({
      apiUrl: 'https://news.example.com',
      cronSecret: 'test-secret',
      repository: {
        verifyIngestion: async (input) => {
          expect(input).toMatchObject({
            section: getSignalSource(input.source).section,
            batchId,
            itemCount: 12
          })
          calls.push(`verify:${input.source}`)
        }
      },
      request: async (url, init) => {
        expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer test-secret')
        expect(init?.redirect).toBe('error')
        const source = String(url).split('/').at(-1)
        calls.push(`request:${source}`)
        return result()
      }
    })
    expect(calls).toEqual(
      SIGNAL_CRON_JOBS.flatMap(({ source }) => [`request:${source}`, `verify:${source}`])
    )
    expect(verified).toEqual(
      SIGNAL_CRON_JOBS.map(({ source }) => ({ source, batchId, itemCount: 12 }))
    )
  })

  it('verifies only explicitly configured production sources without enabling a new source', async () => {
    const request = vi.fn<typeof fetch>(async () => result())
    const sources = SIGNAL_CRON_JOBS.filter((job) => job.source !== 'chatgpt').map(
      (job) => job.source
    )
    const verified = await setupSignalCron({
      apiUrl: 'https://news.example.com',
      cronSecret: 'test-secret',
      sources,
      repository: { verifyIngestion: async () => undefined },
      request
    })
    expect(verified).toHaveLength(sources.length)
    expect(request.mock.calls.some((call) => String(call[0]).endsWith('/chatgpt'))).toBe(false)
  })

  it.each([{ sources: [] }, { sources: ['openai', 'openai'] }])(
    'rejects empty or duplicate job sets',
    async ({ sources }) => {
      const request = vi.fn()
      await expect(
        setupSignalCron({
          apiUrl: 'https://news.example.com',
          cronSecret: 'test-secret',
          sources: sources as Array<'openai'>,
          repository: { verifyIngestion: async () => undefined },
          request
        })
      ).rejects.toThrow('Invalid configured sources')
      expect(request).not.toHaveBeenCalled()
    }
  )

  it('does not return partial evidence when an upstream source fails', async () => {
    const verify = vi.fn()
    await expect(
      setupSignalCron({
        apiUrl: 'https://news.example.com',
        cronSecret: 'test-secret',
        retryDelaysMs: [],
        repository: { verifyIngestion: verify },
        request: async (url) =>
          String(url).endsWith('/openai') ? result() : new Response(null, { status: 502 })
      })
    ).rejects.toThrow('来源 anthropic')
    expect(verify).toHaveBeenCalledTimes(1)
  })

  it('retries transient upstream failures before verifying the batch', async () => {
    const attempts = new Map<string, number>()
    const verified = await setupSignalCron({
      apiUrl: 'https://news.example.com',
      cronSecret: 'test-secret',
      sources: ['openai', 'anthropic'],
      retryDelaysMs: [0],
      repository: { verifyIngestion: async () => undefined },
      request: async (url) => {
        const source = String(url).split('/').at(-1) ?? ''
        const count = (attempts.get(source) ?? 0) + 1
        attempts.set(source, count)
        return source === 'anthropic' && count === 1
          ? new Response(null, { status: 503 })
          : result()
      }
    })
    expect(attempts.get('anthropic')).toBe(2)
    expect(verified).toHaveLength(2)
  })

  it.each([0, null])('rejects missing or invalid item count %s', async (itemCount) => {
    const verify = vi.fn()
    await expect(
      setupSignalCron({
        apiUrl: 'https://news.example.com',
        cronSecret: 'test-secret',
        repository: { verifyIngestion: verify },
        request: async () => Response.json({ batchId, itemCount })
      })
    ).rejects.toThrow()
    expect(verify).not.toHaveBeenCalled()
  })

  it('does not accept an HTTP success when target rows fail verification', async () => {
    await expect(
      setupSignalCron({
        apiUrl: 'https://news.example.com',
        cronSecret: 'test-secret',
        repository: {
          verifyIngestion: async () => {
            throw new Error('target batch mismatch')
          }
        },
        request: async () => result()
      })
    ).rejects.toThrow('target batch mismatch')
  })
})
