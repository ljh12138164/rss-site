import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { SignalArticle } from '../../../../lib/signal-article'
import { getNewsSource } from '../../../../lib/technology-sources'
import { NewsArticleView } from './page'

describe('NewsArticleView', () => {
  const article: SignalArticle = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    source: 'xinhua',
    sourceKey: 'story-1',
    title: '新华社发布最新消息',
    url: 'https://www.news.cn/story',
    summary: '这是一段由新闻来源提供的简要介绍。',
    author: '新华社记者',
    publishedAt: new Date('2026-09-06T01:00:00.000Z'),
    firstSeenAt: new Date('2026-09-06T01:05:00.000Z'),
    lastSeenAt: new Date('2026-09-06T02:00:00.000Z')
  }

  it('shows real article metadata and keeps the original article one action away', () => {
    const html = renderToStaticMarkup(
      <NewsArticleView article={article} source={getNewsSource('xinhua')} />
    )

    expect(html).toContain('新华社发布最新消息')
    expect(html).toContain('这是一段由新闻来源提供的简要介绍。')
    expect(html).toContain('新华社记者')
    expect(html).toContain('查看原文')
    expect(html).toContain('href="/out?url=https%3A%2F%2Fwww.news.cn%2Fstory&amp;from=%2Fnews"')
    expect(html).not.toContain('AI 总结')
    expect(html).not.toContain('翻译为中文')
  })

  it('does not fabricate an introduction when the source has none', () => {
    const html = renderToStaticMarkup(
      <NewsArticleView
        article={{ ...article, summary: null, author: null, publishedAt: null }}
        source={getNewsSource('xinhua')}
      />
    )

    expect(html).not.toContain('文章简介')
    expect(html).not.toContain('暂无摘要')
    expect(html).toContain('查看原文')
  })

  it('renders safe Feed HTML instead of repeating the summary', () => {
    const html = renderToStaticMarkup(
      <NewsArticleView
        article={{
          ...article,
          contentHtml: '<h2>正文标题</h2><p>正文段落</p><script>alert(1)</script>'
        }}
        source={getNewsSource('xinhua')}
      />
    )
    expect(html).toContain('<h2>正文标题</h2>')
    expect(html).toContain('<p>正文段落</p>')
    expect(html).not.toContain('alert(1)')
    expect(html).not.toContain(article.summary)
  })

  it('offers local translation for English articles', () => {
    const html = renderToStaticMarkup(
      <NewsArticleView
        article={{
          ...article,
          title: 'A practical guide to building reliable software systems',
          summary: 'This guide explains how to keep a service reliable in production.'
        }}
        source={getNewsSource('xinhua')}
      />
    )
    expect(html).toContain('翻译为中文')
  })
})
