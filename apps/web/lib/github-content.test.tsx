import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { SectionOverview } from '../components/section-overview'
import { type FeedResult, getTechnologyFeed } from './hot-feed'
import { buildRssSectionData } from './rss-feed'
import { technologyArticleSources, technologySources } from './technology-sources'

const ranking: FeedResult = {
  state: 'ready',
  items: [
    {
      sourceKey: 'repo',
      title: 'owner/repository',
      url: 'https://github.com/owner/repository',
      summary: 'A repository',
      author: null,
      publishedAt: null,
      position: 4
    }
  ],
  status: { itemCount: 1, lastSuccessAt: new Date('2026-09-07T00:00:00Z') }
}

it('keeps Trending out of the technology overview', () => {
  const feeds = Object.fromEntries(
    technologySources.map((source) => [
      source.id,
      source.id === 'github' ? ranking : { state: 'empty' }
    ])
  ) as Record<string, FeedResult>
  const html = renderToStaticMarkup(
    <SectionOverview basePath="/technology" sources={technologyArticleSources} feeds={feeds} />
  )
  expect(html).not.toContain('开源排行榜')
  expect(html).not.toContain('owner/repository')
})

it('preserves upstream rank even when a lower-ranked repository has a newer date', async () => {
  const feed = await getTechnologyFeed('github', 1, async () => ({
    error: null,
    statuses: [{ source: 'github', item_count: 2, last_success_at: '2026-09-07T00:00:00Z' }],
    items: [1, 2].map((position) => ({
      source: 'github',
      source_key: String(position),
      title: `Repo ${position}`,
      url: 'https://github.com/owner/repo',
      summary: null,
      author: null,
      position,
      published_at: `2026-09-0${position}T00:00:00Z`
    }))
  }))
  expect(feed.state === 'ready' && feed.items[0].position).toBe(1)
})

it('does not publish Trending repositories into the article RSS', () => {
  const data = buildRssSectionData(
    {
      id: 'technology',
      title: '科技',
      description: '文章',
      pagePath: '/technology',
      sources: technologySources
    },
    Object.fromEntries(
      technologySources.map((source) => [
        source.id,
        source.id === 'github' ? ranking : { state: 'empty' }
      ])
    ) as Record<(typeof technologySources)[number]['id'], FeedResult>
  )
  expect(data.entries).toEqual([])
})
