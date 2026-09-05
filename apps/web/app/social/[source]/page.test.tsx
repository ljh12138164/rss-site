import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { FeedResult } from '../../../lib/hot-feed'
import { getSocialSource } from '../../../lib/technology-sources'
import { SocialSourceView } from './page'

describe('SocialSourceView', () => {
  it('renders the full source list, media previews, and social breadcrumb context', () => {
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
      <SocialSourceView feed={feed} source={getSocialSource('bilibili')} />
    )

    expect(html).toContain('首页')
    expect(html).toContain('社交热点')
    expect(html).toContain('哔哩哔哩综合热门')
    expect(html).toContain('示例 UP 主')
    expect(html).toContain('aria-current="page"')
    expect(html.match(/loading="lazy"/g)).toHaveLength(7)
    expect(html.match(/href="\/out\?url=/g)).toHaveLength(7)
    expect(html).toContain('from=%2Fsocial')
  })
})
