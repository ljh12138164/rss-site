import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import type { FeedResult } from '../../../lib/hot-feed'
import { getGameSource } from '../../../lib/technology-sources'
import { GameSourceView } from './page'

it('renders Steam as a collection snapshot without a fabricated publication time', () => {
  const feed: FeedResult = {
    state: 'ready',
    items: [
      {
        sourceKey: 'steam-1',
        title: '当前热销游戏',
        url: 'https://store.steampowered.com/app/1',
        summary: null,
        author: null,
        publishedAt: null,
        position: 1
      }
    ],
    status: { itemCount: 1, lastSuccessAt: new Date('2026-09-05T08:05:00.000Z') }
  }

  const html = renderToStaticMarkup(<GameSourceView feed={feed} source={getGameSource('steam')} />)

  expect(html).toContain('首页')
  expect(html).toContain('游戏')
  expect(html).toContain('Steam 热销榜')
  expect(html).toContain('采集时间只表示榜单快照更新时间')
  expect(html).toContain('from=%2Fgames')
  expect(html.match(/<time/g)).toHaveLength(1)
})
