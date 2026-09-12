import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it, vi } from 'vitest'
import type { FeedResult, GameFeeds } from '../../lib/hot-feed'
import { gameSources } from '../../lib/technology-sources'
import Layout from './layout'
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
        publishedAt: new Date('2026-09-05T08:00:00.000Z'),
        position: 1
      }
    ],
    status: { itemCount: 1, lastSuccessAt: new Date('2026-09-05T08:05:00.000Z') }
  }
}

vi.mock('next/navigation', () => ({ usePathname: () => '/games' }))

it('renders five game sources', () => {
  const feeds = Object.fromEntries(
    gameSources.map((source) => [source.id, readyFeed(source.id)])
  ) as GameFeeds
  feeds.indienova = { state: 'empty' }
  feeds.ali213 = { state: 'error' }

  const html = renderToStaticMarkup(
    <Layout>
      <GamesView feeds={feeds} />
    </Layout>
  )

  expect(html).toContain('aria-label="内容来源"')
  expect(html).toContain('>机核<')
  expect(html).toContain('部分来源暂时无法加载，请稍后再试。')
  expect(html).not.toContain('暂无内容。')
  expect(html).not.toContain('查看全部')
  expect(html).toContain('from=%2Fgames')
  for (const source of gameSources) expect(html).toContain(source.shortName)
  expect(html).not.toContain('6H')
  expect(html).not.toContain('更新于')
  expect(html).not.toContain('信号台')
})
