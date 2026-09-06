import { describe, expect, it } from 'vitest'
import type { FeedResult, HotItem } from './hot-feed'
import {
  buildRssSectionData,
  parseRssFeedName,
  type RssSectionConfig,
  renderRssSectionXml
} from './rss-feed'
import { technologySources } from './technology-sources'

const github = technologySources[0]
const hackerNews = technologySources[1]

function item(overrides: Partial<HotItem> = {}): HotItem {
  return {
    sourceKey: 'item-1',
    title: 'Example',
    url: 'https://example.com/article',
    summary: null,
    author: null,
    publishedAt: null,
    position: 1,
    ...overrides
  }
}

function ready(items: HotItem[], lastSuccessAt: string): FeedResult {
  return {
    state: 'ready',
    items,
    status: { itemCount: items.length, lastSuccessAt: new Date(lastSuccessAt) }
  }
}

const config = {
  id: 'technology',
  title: '科技',
  description: '当前科技热点',
  pagePath: '/technology',
  sources: [github, hackerNews]
} as const satisfies RssSectionConfig

describe('section RSS feeds', () => {
  it('accepts only the six stable XML feed names', () => {
    expect(parseRssFeedName('ai.xml')).toBe('ai')
    expect(parseRssFeedName('games.xml')).toBe('games')
    expect(parseRssFeedName('ai')).toBeNull()
    expect(parseRssFeedName('github.xml')).toBeNull()
  })

  it('orders dated entries newest-first, leaves undated entries last, and uses the newest status', () => {
    const data = buildRssSectionData(config, {
      'hacker-news': ready(
        [item({ title: 'HN', publishedAt: new Date('2026-09-05T03:00:00.000Z') })],
        '2026-09-05T01:00:00.000Z'
      ),
      github: ready(
        [
          item({ title: 'GitHub 1', publishedAt: new Date('2026-09-05T01:00:00.000Z') }),
          item({ sourceKey: 'item-2', title: 'GitHub 2', position: 2 })
        ],
        '2026-09-05T02:00:00.000Z'
      )
    })

    expect(data.entries.map(({ source, item: entry }) => `${source.id}:${entry.title}`)).toEqual([
      'hacker-news:HN',
      'github:GitHub 1',
      'github:GitHub 2'
    ])
    expect(data.lastBuildDate).toEqual(new Date('2026-09-05T02:00:00.000Z'))
    expect(data.unavailable).toBe(false)
  })

  it('marks a section unavailable only when every source failed', () => {
    expect(
      buildRssSectionData(config, { github: { state: 'error' }, 'hacker-news': { state: 'error' } })
        .unavailable
    ).toBe(true)
    expect(
      buildRssSectionData(config, { github: { state: 'empty' }, 'hacker-news': { state: 'error' } })
        .unavailable
    ).toBe(false)
  })

  it('escapes XML, removes invalid controls, and omits missing publication dates', () => {
    const data = buildRssSectionData(config, {
      github: ready(
        [
          item({
            sourceKey: 'key&"',
            title: 'A & <B>\u0001',
            url: 'https://example.com/article?a=1&b=2',
            summary: 'A "short" summary & more'
          })
        ],
        '2026-09-05T02:00:00.000Z'
      ),
      'hacker-news': { state: 'empty' }
    })

    const xml = renderRssSectionXml(data, 'https://hot.example')

    expect(xml).toContain('<title>A &amp; &lt;B&gt;</title>')
    expect(xml).not.toContain('\u0001')
    expect(xml).toContain('<link>https://example.com/article?a=1&amp;b=2</link>')
    expect(xml).toContain('<guid isPermaLink="false">technology:github:key&amp;&quot;</guid>')
    expect(xml).toContain('<category>GitHub Trending</category>')
    expect(xml).toContain('<description>A &quot;short&quot; summary &amp; more</description>')
    expect(xml).toContain(
      '<atom:link href="https://hot.example/feeds/technology.xml" rel="self" type="application/rss+xml" />'
    )
    expect(xml).not.toContain('<pubDate>')
  })

  it('emits a real item publication date when one is available', () => {
    const data = buildRssSectionData(config, {
      github: ready(
        [item({ publishedAt: new Date('2026-09-05T03:04:05.000Z') })],
        '2026-09-05T04:00:00.000Z'
      ),
      'hacker-news': { state: 'empty' }
    })

    expect(renderRssSectionXml(data, 'https://hot.example')).toContain(
      '<pubDate>Sat, 05 Sep 2026 03:04:05 GMT</pubDate>'
    )
  })
})
