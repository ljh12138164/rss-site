import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it, vi } from 'vitest'
import type { FeedResult } from '../../../lib/hot-feed'
import { getGameSource } from '../../../lib/technology-sources'
import Layout from '../layout'
import { GameSourceView } from './page'

vi.mock('next/navigation', () => ({ usePathname: () => '/games/gcores' }))

it('renders a game source article list', () => {
  const feed: FeedResult = {
    state: 'ready',
    items: [
      {
        sourceKey: 'gcores-1',
        title: '当前热销游戏',
        url: 'https://www.gcores.com/articles/1',
        summary: null,
        author: null,
        publishedAt: null,
        position: 1
      }
    ],
    status: { itemCount: 1, lastSuccessAt: new Date('2026-09-05T08:05:00.000Z') }
  }

  const html = renderToStaticMarkup(
    <Layout>
      <GameSourceView feed={feed} source={getGameSource('gcores')} />
    </Layout>
  )

  expect(html).toContain('首页')
  expect(html).toContain('游戏')
  expect(html).toContain('机核')
  expect(html).toContain('游戏文化与编辑文章')
  expect(html).toContain('内容来源')
  expect(html).toContain('data-outbound')
  expect(html).not.toContain('href="/out?')
  expect(html).toContain('href="https://www.gcores.com/articles/1"')
  expect(html).not.toContain('采集时间')
  expect(html).not.toContain('更新于')
  expect(html).not.toContain('<time')
})
