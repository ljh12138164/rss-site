import { describe, expect, it, vi } from 'vitest'
import { looksLikeEnglish } from './article-language'
import { translateArticle } from './article-translation'
import type { SignalArticle } from './signal-article'

const article: SignalArticle = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  source: 'github-blog',
  sourceKey: 'one',
  title: 'A practical guide to building reliable software systems',
  url: 'https://example.com/posts/one',
  summary: 'This guide explains how to keep a service reliable in production.',
  contentHtml: '<p>Read the <strong>complete guide</strong>.</p><script>bad()</script>',
  author: null,
  publishedAt: null,
  firstSeenAt: new Date('2026-01-01T00:00:00Z'),
  lastSeenAt: new Date('2026-01-01T00:00:00Z')
}

describe('article translation', () => {
  it('only classifies predominantly English content as English', () => {
    expect(looksLikeEnglish('A practical guide to building reliable software systems')).toBe(true)
    expect(looksLikeEnglish('这是一篇中文技术文章，介绍可靠的软件系统。')).toBe(false)
  })

  it('sanitizes source and translated HTML around the translator', async () => {
    const translate = vi.fn(async (text: string, html = false) =>
      html
        ? text.replace('Read the', '阅读').replace('complete guide', '完整指南')
        : `中文：${text}`
    )
    const result = await translateArticle(article, 'technology', translate)

    expect(translate).toHaveBeenNthCalledWith(1, article.title)
    expect(translate).toHaveBeenNthCalledWith(
      2,
      '<p>Read the <strong>complete guide</strong>.</p>',
      true
    )
    expect(result.title).toContain('中文：')
    expect(result.contentHtml).toBe('<p>阅读 <strong>完整指南</strong>.</p>')
    expect(result.summary).toBeNull()
  })

  it('rejects non-English articles before translation', async () => {
    const translate = vi.fn()
    await expect(
      translateArticle(
        { ...article, title: '中文标题', contentHtml: '<p>中文正文内容</p>' },
        'ai',
        translate
      )
    ).rejects.toThrow('ARTICLE_NOT_ENGLISH')
    expect(translate).not.toHaveBeenCalled()
  })
})
