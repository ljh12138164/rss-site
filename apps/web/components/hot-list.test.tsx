import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { HotList } from './hot-list'

describe('HotList', () => {
  it('routes ranked items through the local outbound notice', () => {
    const html = renderToStaticMarkup(
      <HotList
        items={[
          {
            sourceKey: 'article-1',
            title: '构建可靠的前端应用',
            url: 'https://juejin.cn/post/1',
            summary: '从边界状态和数据流开始设计。',
            author: '示例作者',
            publishedAt: new Date('2026-09-04T01:00:00.000Z'),
            position: 1
          }
        ]}
      />
    )

    expect(html).toContain('01')
    expect(html).toContain('构建可靠的前端应用')
    expect(html).toContain('从边界状态和数据流开始设计。')
    expect(html).toContain('示例作者')
    expect(html.replace(/<[^>]*>/g, '')).toContain('2026/09/04')
    expect(html).toContain(
      'href="/out?url=https%3A%2F%2Fjuejin.cn%2Fpost%2F1&amp;from=%2Ftechnology"'
    )
    expect(html).not.toContain('href="https://juejin.cn/post/1"')
    expect(html).not.toContain('target="_blank"')
  })

  it('links persisted news items to their internal detail page', () => {
    const html = renderToStaticMarkup(
      <HotList
        internalArticles
        items={[
          {
            articleId: '00000000-0000-0000-0000-000000000101',
            sourceKey: 'xinhua-1',
            title: '新华社发布最新消息',
            url: 'https://www.news.cn/story',
            summary: '这是一段由上游提供的新闻摘要。',
            author: null,
            publishedAt: null,
            position: 1
          }
        ]}
        returnTo="/news"
        source="xinhua"
      />
    )

    expect(html).toContain(
      'href="/news/xinhua/新华社发布最新消息--00000000-0000-0000-0000-000000000101"'
    )
    expect(html).toContain('这是一段由上游提供的新闻摘要。')
    expect(html).not.toContain('href="/out?url=')
  })
})
