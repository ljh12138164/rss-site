import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { openDB } from 'idb'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ArticleSummary } from './article-summary-result'

const summary: ArticleSummary = {
  overview: '文章概述',
  keyPoints: ['第一条', '第二条', '第三条'],
  basis: 'content'
}
const day = 24 * 60 * 60 * 1000

beforeEach(() => {
  vi.resetModules()
  vi.stubGlobal('indexedDB', new IDBFactory())
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('persists a validated summary across module reloads and separates content versions', async () => {
  const cache = await import('./article-summary-cache')
  await cache.writeLocalSummary('article:content-v1', summary)
  vi.resetModules()
  const reloaded = await import('./article-summary-cache')
  expect(await reloaded.readLocalSummary('article:content-v1')).toEqual(summary)
  expect(await reloaded.readLocalSummary('article:content-v2')).toBeNull()
})

it('expires after thirty days without extending expiry when read', async () => {
  const now = vi.spyOn(Date, 'now').mockReturnValue(10_000)
  const cache = await import('./article-summary-cache')
  await cache.writeLocalSummary('article', summary)
  now.mockReturnValue(10_000 + 29 * day)
  expect(await cache.readLocalSummary('article')).toEqual(summary)
  now.mockReturnValue(10_000 + 30 * day)
  expect(await cache.readLocalSummary('article')).toBeNull()
  const db = await openDB('rss-site-ai-summary', 1)
  expect(await db.get('summaries', 'article')).toBeUndefined()
  db.close()
})

it.each([
  { summary: { overview: 'bad', keyPoints: [] }, expiresAt: Date.now() + day },
  { summary, expiresAt: 'forever' },
  { summary, expiresAt: Number.POSITIVE_INFINITY }
])('discards malformed records instead of displaying them: %j', async (record) => {
  const cache = await import('./article-summary-cache')
  await cache.readLocalSummary('article')
  const db = await openDB('rss-site-ai-summary', 1)
  await db.put('summaries', record, 'article')
  expect(await cache.readLocalSummary('article')).toBeNull()
  expect(await db.get('summaries', 'article')).toBeUndefined()
  db.close()
})

it('does not store invalid summary results', async () => {
  const cache = await import('./article-summary-cache')
  await cache.writeLocalSummary('article', { ...summary, keyPoints: [] })
  expect(await cache.readLocalSummary('article')).toBeNull()
})

it('falls back when IndexedDB is unavailable, then recovers from an open failure', async () => {
  const cache = await import('./article-summary-cache')
  vi.stubGlobal('indexedDB', undefined)
  expect(await cache.readLocalSummary('article')).toBeNull()
  await expect(cache.writeLocalSummary('article', summary)).resolves.toBeUndefined()

  const factory = new IDBFactory()
  vi.stubGlobal('indexedDB', factory)
  const opening = vi.spyOn(factory, 'open').mockImplementation(() => {
    throw new Error('storage disabled')
  })
  expect(await cache.readLocalSummary('article')).toBeNull()
  await expect(cache.writeLocalSummary('article', summary)).resolves.toBeUndefined()
  opening.mockRestore()
  await cache.writeLocalSummary('article', summary)
  expect(await cache.readLocalSummary('article')).toEqual(summary)
})
