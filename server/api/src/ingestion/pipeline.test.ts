import { getSignalSource } from '@rss-site/signals'
import { describe, expect, it, vi } from 'vitest'
import type { Database } from '../db/client.js'
import { readBoundedText } from './fetch.js'
import { runIngestionPipeline } from './pipeline.js'

function sampleRssXml(title = 'Test Article', link = 'https://example.com/1') {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Sample Feed</title>
    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description>Sample description</description>
      <pubDate>Fri, 25 Sep 2026 05:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`
}

describe('runIngestionPipeline', () => {
  it('executes full pipeline successfully with provided dependencies', async () => {
    const source = getSignalSource('github-blog')
    const recordedSuccesses: unknown[] = []
    const logMessages: string[] = []

    // Mock database transaction simulating DrizzleSignalStore
    const fakeDb = {
      transaction: vi.fn(async (callback: (tx: unknown) => unknown) => {
        const tx = {
          select: () => ({
            from: () => ({
              leftJoin: () => ({
                where: () => []
              })
            })
          }),
          insert: () => ({
            values: () => ({
              onConflictDoUpdate: () => ({
                returning: () => [{ id: 'art-1', sourceKey: 'https://example.com/1' }]
              }),
              onConflictDoNothing: () => Promise.resolve()
            })
          }),
          update: () => ({
            set: () => ({
              where: () => Promise.resolve()
            })
          }),
          delete: () => ({
            where: () => Promise.resolve()
          })
        }
        const result = await callback(tx)
        recordedSuccesses.push(result)
        return { changed: true, events: [] }
      }),
      insert: vi.fn(() => ({
        values: () => Promise.resolve()
      }))
    } as unknown as Database

    const result = await runIngestionPipeline(source, {
      db: fakeDb,
      rsshubBaseUrl: 'https://rsshub.test',
      fetchFeed: async () => sampleRssXml(),
      logger: {
        info: (msg) => logMessages.push(msg),
        error: vi.fn()
      }
    })

    expect(result.source).toBe('github-blog')
    expect(result.itemCount).toBe(1)
    expect(result.changed).toBe(true)
    expect(result.publication).toBe('disabled') // No webAppUrl provided
    expect(logMessages).toHaveLength(1)
    expect(JSON.parse(logMessages[0] ?? '{}')).toMatchObject({
      source: 'github-blog',
      itemCount: 1,
      changed: true,
      publication: 'disabled'
    })
  })

  it('records failure in DB and rethrows on fetch or parse errors', async () => {
    const source = getSignalSource('github-blog')
    const insertedFailures: unknown[] = []

    const fakeDb = {
      transaction: vi.fn(),
      insert: vi.fn(() => ({
        values: (data: unknown) => {
          insertedFailures.push(data)
          return Promise.resolve()
        }
      }))
    } as unknown as Database

    await expect(
      runIngestionPipeline(source, {
        db: fakeDb,
        rsshubBaseUrl: 'https://rsshub.test',
        fetchFeed: async () => 'Invalid XML'
      })
    ).rejects.toThrow()

    expect(insertedFailures).toHaveLength(1)
    expect(insertedFailures[0]).toMatchObject({
      source: 'github-blog',
      status: 'failed'
    })
  })
})

describe('readBoundedText', () => {
  it('throws error if Content-Length exceeds limit', async () => {
    const response = new Response('content', {
      headers: { 'Content-Length': '1000' }
    })
    await expect(readBoundedText(response, 500)).rejects.toThrow(
      'Signal feed exceeded the response size limit'
    )
  })

  it('reads bounded stream within limit', async () => {
    const response = new Response('small payload')
    const text = await readBoundedText(response, 100)
    expect(text).toBe('small payload')
  })

  it('aborts stream when received bytes exceed limit', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(100))
        controller.enqueue(new Uint8Array(100))
        controller.close()
      }
    })
    const response = new Response(stream)
    await expect(readBoundedText(response, 50)).rejects.toThrow(
      'Signal feed exceeded the response size limit'
    )
  })
})
