import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { HomeView } from '../../components/latest-overview'
import type { HomeDigest } from '../../lib/home-articles'
import { aiSources, newsSources, type socialSources } from '../../lib/technology-sources'

type Platform =
  | (typeof aiSources)[number]
  | (typeof newsSources)[number]
  | (typeof socialSources)[number]

function article(
  id: string,
  title: string,
  section: '/ai' | '/news' | '/social',
  platform: Platform,
  position: number
) {
  return {
    articleId: id,
    sourceKey: id,
    title,
    url: `https://example.com/${id}`,
    summary: null,
    author: null,
    publishedAt: '2026-09-07T00:00:00Z',
    position,
    section,
    platform
  }
}

const digest: HomeDigest = {
  top: [
    article('t1', '头条一', '/news', newsSources[0], 1),
    article('t2', 'AI 动态', '/ai', aiSources[0], 2)
  ],
  sections: [
    {
      path: '/ai',
      name: 'AI',
      tagline: '模型发布与产品动态',
      items: [article('a1', 'GPT 更新', '/ai', aiSources[0], 1)]
    },
    {
      path: '/news',
      name: '国内新闻',
      tagline: '要闻与即时消息',
      items: [article('n1', '即时消息', '/news', newsSources[0], 1)]
    },
    {
      path: '/social',
      name: '社交热点',
      tagline: '社区与视频热议',
      items: []
    }
  ]
}

it('renders top signals and a per-section directory without the article feed', () => {
  const html = renderToStaticMarkup(<HomeView digest={digest} />)

  // Top signals strip
  expect(html).toContain('今日速览')
  expect(html).not.toContain('data-rank=')
  expect(html.indexOf('头条一')).toBeLessThan(html.indexOf('AI 动态'))

  // Section directory
  expect(html).toContain('分区导览')
  expect(html).toContain('GPT 更新')
  expect(html).toContain('即时消息')
  expect(html).toContain('进入AI')
  expect(html).toContain('进入国内新闻')
  expect(html).toContain('进入社交热点')
  expect(html).toContain('href="/ai"')
  expect(html).toContain('href="/news"')
  expect(html).toContain('href="/social"')

  // Internal reader links for news and AI
  expect(html).toContain('href="/news/xinhua/头条一--t1"')
  expect(html).toContain('href="/ai/openai/ai-动态--t2"')

  // Empty section renders a placeholder
  expect(html).toContain('暂无内容')

  // No infinite-scroll article feed on the front page
  expect(html).not.toContain('加载更多')
})

it('omits the top signals block when there is nothing to show', () => {
  const empty: HomeDigest = { top: [], sections: digest.sections }
  const html = renderToStaticMarkup(<HomeView digest={empty} />)
  expect(html).not.toContain('今日速览')
  expect(html).toContain('分区导览')
})
