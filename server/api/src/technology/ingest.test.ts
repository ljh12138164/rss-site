import { describe, expect, it } from 'vitest'
import type { TechnologyFeedItem } from './feed.js'
import { ingestTechnology, type SuccessfulIngestion, type TechnologyStore } from './ingest.js'
import { getTechnologySource } from './sources.js'

class MemoryStore implements TechnologyStore {
  readonly items = new Map<string, TechnologyFeedItem>()
  readonly failedRuns: string[] = []
  successCount = 0

  async replaceRanking(input: SuccessfulIngestion) {
    const currentKeys = new Set(input.items.map((item) => item.sourceKey))
    for (const key of this.items.keys()) {
      if (!currentKeys.has(key)) this.items.delete(key)
    }
    for (const item of input.items) this.items.set(item.sourceKey, item)
    this.successCount += 1
  }

  async recordFailure(input: { errorMessage: string }) {
    this.failedRuns.push(input.errorMessage)
  }
}

function feed(items: Array<{ id: string; title: string }>) {
  const entries = items
    .map(
      ({ id, title }) => `
        <item>
          <title>${title}</title>
          <link>https://example.com/${id}</link>
          <guid>${id}</guid>
        </item>`
    )
    .join('')

  return `<rss><channel>${entries}</channel></rss>`
}

describe('ingestTechnology', () => {
  const source = getTechnologySource('github')

  it('reconciles repeated feeds into one current ordered ranking', async () => {
    const store = new MemoryStore()
    const now = new Date('2026-09-04T01:00:00.000Z')

    await ingestTechnology(
      source,
      {
        fetchFeed: async () =>
          feed([
            { id: '1', title: 'A' },
            { id: '2', title: 'B' }
          ]),
        store
      },
      now
    )
    const result = await ingestTechnology(
      source,
      { fetchFeed: async () => feed([{ id: '2', title: 'B updated' }]), store },
      now
    )

    expect(result.itemCount).toBe(1)
    expect(store.successCount).toBe(2)
    expect([...store.items.values()].map((item) => item.title)).toEqual(['B updated'])
  })

  it('records an upstream failure without replacing the last successful ranking', async () => {
    const store = new MemoryStore()
    const now = new Date('2026-09-04T01:00:00.000Z')
    await ingestTechnology(
      source,
      { fetchFeed: async () => feed([{ id: '1', title: 'Last good item' }]), store },
      now
    )

    await expect(
      ingestTechnology(
        source,
        {
          fetchFeed: async () => {
            throw new Error('RSSHub timeout')
          },
          store
        },
        now
      )
    ).rejects.toThrow('RSSHub timeout')

    expect([...store.items.values()].map((item) => item.title)).toEqual(['Last good item'])
    expect(store.successCount).toBe(1)
    expect(store.failedRuns).toEqual(['RSSHub timeout'])
  })

  it('records an empty feed as failed without replacing current items', async () => {
    const store = new MemoryStore()

    await expect(
      ingestTechnology(
        source,
        { fetchFeed: async () => '<rss><channel /></rss>', store },
        new Date('2026-09-04T01:00:00.000Z')
      )
    ).rejects.toThrow('empty GitHub Trending feed')

    expect(store.successCount).toBe(0)
    expect(store.failedRuns[0]).toContain('empty GitHub Trending feed')
  })
})
