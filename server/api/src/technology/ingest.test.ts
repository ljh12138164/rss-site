import { getSignalSource } from '@rss-site/signals'
import { describe, expect, it } from 'vitest'
import type { TechnologyFeedItem } from './feed.js'
import { ingestSignal, type SignalStore, type SuccessfulIngestion } from './ingest.js'
import { getNewsSource, getTechnologySource } from './sources.js'

class MemoryStore implements SignalStore {
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
    return { changed: true, events: [] }
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

describe('ingestSignal', () => {
  const source = getTechnologySource('github')

  it('merges platform feeds by URL, keeps the complete body, and sorts before limiting', async () => {
    const store = new MemoryStore()
    const source = getTechnologySource('nvidia')
    const xml = (id: string, title: string, date: string, body: string) =>
      `<rss><channel><item><guid>${title}</guid><title>${title}</title><link>https://example.com/${id}</link><pubDate>${date}</pubDate><description>${body}</description></item></channel></rss>`

    await ingestSignal(source, {
      fetchFeed: async () => [
        feed(
          Array.from({ length: 31 }, (_, index) => ({
            id: `old-${index}`,
            title: `Older ${index}`
          }))
        ),
        xml('shared', 'Newsroom', '2026-10-02T00:00:00Z', 'Excerpt'),
        xml('shared', 'Blog', '2026-10-02T00:00:00Z', 'Complete article body'),
        xml('new', 'Newest', '2026-10-03T00:00:00Z', 'New body')
      ],
      store
    })

    expect(
      [...store.items.values()]
        .slice(0, 2)
        .map((item) => [item.title, item.position, item.sourceKey])
    ).toEqual([
      ['Newest', 1, 'https://example.com/new'],
      ['Blog', 2, 'https://example.com/shared']
    ])
    expect(store.items.size).toBe(30)
    expect(store.items.get('https://example.com/shared')?.contentHtml).toContain(
      'Complete article body'
    )
  })

  it('preserves the platform ranking when one component feed fails', async () => {
    const store = new MemoryStore()
    const source = getTechnologySource('nvidia')
    await ingestSignal(source, {
      fetchFeed: async () => [feed([{ id: '1', title: 'Last good item' }])],
      store
    })

    await expect(
      ingestSignal(source, {
        fetchFeed: async () => [feed([{ id: '2', title: 'New item' }]), '<rss><channel /></rss>'],
        store
      })
    ).rejects.toThrow('empty NVIDIA feed')

    expect([...store.items.values()].map((item) => item.title)).toEqual(['Last good item'])
    expect(store.successCount).toBe(1)
  })

  it('reconciles repeated feeds into one current ordered ranking', async () => {
    const store = new MemoryStore()
    const now = new Date('2026-09-04T01:00:00.000Z')

    await ingestSignal(
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
    const result = await ingestSignal(
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
    await ingestSignal(
      source,
      { fetchFeed: async () => feed([{ id: '1', title: 'Last good item' }]), store },
      now
    )

    await expect(
      ingestSignal(
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
      ingestSignal(
        source,
        { fetchFeed: async () => '<rss><channel /></rss>', store },
        new Date('2026-09-04T01:00:00.000Z')
      )
    ).rejects.toThrow('empty GitHub Trending feed')

    expect(store.successCount).toBe(0)
    expect(store.failedRuns[0]).toContain('empty GitHub Trending feed')
  })

  it.each([
    ['2026-10-11T15:59:00Z', '2026-10-10T16:00:00.000Z'],
    ['2026-10-11T16:01:00Z', '2026-10-11T16:00:00.000Z']
  ])('uses Shanghai midnight for missing and invalid news dates at %s', async (now, expected) => {
    const store = new MemoryStore()
    const xml =
      '<rss><channel><item><title>Missing</title><link>https://example.com/missing</link></item><item><title>Invalid</title><link>https://example.com/invalid</link><pubDate>Invalid Date</pubDate></item><item><title>Real</title><link>https://example.com/real</link><pubDate>Sun, 11 Oct 2026 05:00:00 GMT</pubDate></item></channel></rss>'
    await ingestSignal(
      getNewsSource('chinanews'),
      { fetchFeed: async () => xml, store },
      new Date(now)
    )
    expect([...store.items.values()].map((item) => item.publishedAt?.toISOString())).toEqual([
      expected,
      expected,
      '2026-10-11T05:00:00.000Z'
    ])
  })

  it.each(['github', 'skills-all-time'] as const)(
    'leaves missing dates alone for %s',
    async (id) => {
      const store = new MemoryStore()
      await ingestSignal(
        getSignalSource(id),
        { fetchFeed: async () => feed([{ id: '1', title: 'Ranking' }]), store },
        new Date('2026-10-11T18:25:00Z')
      )
      expect([...store.items.values()][0]?.publishedAt).toBeNull()
    }
  )

  it('does not use an Atom update time as the news publication time', async () => {
    const store = new MemoryStore()
    await ingestSignal(
      getNewsSource('chinanews'),
      {
        fetchFeed: async () =>
          '<feed><entry><title>News</title><link href="https://example.com/1"/><updated>2026-10-12T05:00:00Z</updated></entry></feed>',
        store
      },
      new Date('2026-10-12T12:00:00Z')
    )
    expect([...store.items.values()][0]?.publishedAt?.toISOString()).toBe(
      '2026-10-11T16:00:00.000Z'
    )
  })
})
