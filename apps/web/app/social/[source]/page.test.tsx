import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { FeedResult } from '../../../lib/hot-feed'
import { getSocialSource } from '../../../lib/technology-sources'
import Layout from '../layout'
import { SocialSourceView } from './page'

vi.mock('next/navigation', () => ({ usePathname: () => '/social/bilibili' }))

describe('SocialSourceView', () => {
  it('renders the full source list and social platform navigation without images', () => {
    const feed: FeedResult = {
      state: 'ready',
      items: Array.from({ length: 7 }, (_, index) => ({
        sourceKey: `video-${index + 1}`,
        title: `视频 ${index + 1}`,
        url: `https://www.bilibili.com/video/BV${index + 1}`,
        imageUrl: `https://i2.hdslb.com/bfs/archive/${index + 1}.jpg`,
        summary: null,
        author: '示例 UP 主',
        publishedAt: new Date('2026-09-05T03:00:00.000Z'),
        position: index + 1
      })),
      status: {
        itemCount: 7,
        lastSuccessAt: new Date('2026-09-05T03:00:00.000Z')
      }
    }

    const html = renderToStaticMarkup(
      <Layout>
        <SocialSourceView feed={feed} source={getSocialSource('bilibili')} />
      </Layout>
    )

    expect(html).toContain('首页')
    expect(html).toContain('社交')
    expect(html).toContain('哔哩哔哩综合热门')
    expect(html).toContain('示例 UP 主')
    expect(html).toContain('aria-current="page"')
    expect(html).toContain('内容来源')
    expect(html.match(/href="\/out\?url=/g)).toHaveLength(7)
    expect(html).toContain('from=%2Fsocial')
    expect(html.match(/src="\/source-icons\//g)).toHaveLength(6)
    expect(html).not.toContain('每六小时')
    expect(html).not.toContain('更新于')
  })
})
