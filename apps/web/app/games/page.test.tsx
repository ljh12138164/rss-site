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

  expect(html).toContain('aria-label="游戏平台"')
  expect(html).toContain('全部平台')
  expect(html).toContain('游戏资讯、编辑文章和 Steam 热销榜。')
  expect(html).toContain('暂时无法加载，请稍后再试。')
  expect(html).toContain('暂无内容。')
  expect(html).toContain('from=%2Fgames')
  for (const source of gameSources) expect(html).toContain(source.name)
  expect(html).not.toContain('6H')
  expect(html).not.toContain('更新于')
  expect(html).not.toContain('信号台')
})
