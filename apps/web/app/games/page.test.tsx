import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import type { FeedResult, GameFeeds } from '../../lib/hot-feed'
import { gameSources } from '../../lib/technology-sources'
import { GamesView } from './page'

function readyFeed(source: string): FeedResult {
  return {
    state: 'ready',
    items: [
      {
        sourceKey: `${source}-1`,
        title: `${source} 游戏热点`,
        url: `https://example.com/${source}/1`,
        summary: null,
        author: null,
        publishedAt: source === 'steam' ? null : new Date('2026-09-05T08:00:00.000Z'),
        position: 1
      }
    ],
    status: { itemCount: 1, lastSuccessAt: new Date('2026-09-05T08:05:00.000Z') }
  }
}

it('renders six game sources while describing Steam as a snapshot', () => {
  const feeds = Object.fromEntries(
    gameSources.map((source) => [source.id, readyFeed(source.id)])
  ) as GameFeeds
  feeds.indienova = { state: 'empty' }
  feeds.ali213 = { state: 'error' }

  const html = renderToStaticMarkup(<GamesView feeds={feeds} />)

  expect(html).toContain('游戏热点信号台')
  expect(html).toContain('Steam 显示当前热销榜快照，不伪造发布时间')
  expect(html).toContain('这一路信号暂时不可读')
  expect(html).toContain('正在等待第一轮采集')
  expect(html).toContain('Refresh window · 6H')
  expect(html).toContain('from=%2Fgames')
  for (const source of gameSources) expect(html).toContain(source.name)
})
