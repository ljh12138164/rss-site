import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import type { FeedResult, FinanceFeeds } from '../../lib/hot-feed'
import { financeSources } from '../../lib/technology-sources'
import { FinanceView } from './page'

function readyFeed(source: string): FeedResult {
  return {
    state: 'ready',
    items: [
      {
        sourceKey: `${source}-1`,
        title: `${source} 财经热点`,
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

it('renders six independent finance source bands and honest empty states', () => {
  const feeds = Object.fromEntries(
    financeSources.map((source) => [source.id, readyFeed(source.id)])
  ) as FinanceFeeds
  feeds.jin10 = { state: 'empty' }
  feeds.stcn = { state: 'error' }

  const html = renderToStaticMarkup(<FinanceView feeds={feeds} />)

  expect(html).toContain('aria-label="财经平台"')
  expect(html).toContain('全部平台')
  expect(html).toContain('仅作信息浏览')
  expect(html).toContain('暂时无法加载，请稍后再试。')
  expect(html).toContain('暂无内容。')
  expect(html).toContain('from=%2Ffinance')
  for (const source of financeSources) expect(html).toContain(source.name)
  expect(html).not.toContain('6H')
  expect(html).not.toContain('更新于')
  expect(html).not.toContain('信号台')
})
