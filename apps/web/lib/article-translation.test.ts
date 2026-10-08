import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiEvent } from './ai-events'
import { looksLikeEnglish } from './article-language'
import {
  TranslationBusyError,
  translateArticle,
  translateArticleOnce,
  translateEvent,
  translateEventOnce
} from './article-translation'
import type { SignalArticle } from './signal-article'

const cache = vi.hoisted(() => new Map<string, string>())
vi.mock('./redis-cache', async (importOriginal) => {
  const original = await importOriginal<typeof import('./redis-cache')>()
  return {
    ...original,
    readResultCache: async (key: string, validate: (value: unknown) => boolean) => {
      const value = JSON.parse(cache.get(key) ?? 'null')
      return validate(value) ? value : null
    },
    writeResultCache: async (key: string, value: unknown) => {
      cache.set(key, JSON.stringify(value))
    }
  }
})

const translateText = vi.hoisted(() => vi.fn(async (text: string) => `中文：${text}`))
const azureTranslate = vi.hoisted(() => vi.fn())
vi.mock('./azure-translation', () => ({ translateWithAzure: azureTranslate }))
vi.mock('mtranserver', () => ({
  MTran: class {
    init = async () => undefined
    downloadModel = async () => undefined
    translate = (_from: string, _to: string, text: string) => translateText(text)
  }
}))

beforeEach(() => {
  cache.clear()
  translateText.mockClear()
  azureTranslate.mockReset().mockResolvedValue(null)
})

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

const event: AiEvent = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  slug: 'openai-launches-gpt-5',
  title: 'OpenAI launches a new flagship model',
  summary: 'The company announced a faster model with stronger reasoning capabilities.',
  occurred_at: '2026-01-01T00:00:00Z',
  first_published_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z'
}

describe('article translation', () => {
  it('uses Azure for articles, sanitizes its HTML and caches without local inference', async () => {
    azureTranslate
      .mockResolvedValueOnce('云端标题')
      .mockResolvedValueOnce('<p>中文正文</p><script>bad()</script>')
    const first = await translateArticleOnce(article, 'technology')
    expect(first).toEqual({ title: '云端标题', contentHtml: '<p>中文正文</p>', summary: null })
    expect(azureTranslate).toHaveBeenNthCalledWith(1, article.title, false)
    expect(azureTranslate).toHaveBeenNthCalledWith(
      2,
      '<p>Read the <strong>complete guide</strong>.</p>',
      true
    )
    expect(translateText).not.toHaveBeenCalled()
    expect([...cache.keys()][0]).toContain('azure-v3-mtran-4.0.33-en-zh-v1')
    azureTranslate.mockClear()
    expect(await translateArticleOnce(article, 'technology')).toEqual(first)
    expect(azureTranslate).not.toHaveBeenCalled()
    expect(translateText).not.toHaveBeenCalled()
  })

  it('uses Azure for event title and summary without local inference', async () => {
    azureTranslate.mockResolvedValueOnce('云端事件标题').mockResolvedValueOnce('云端事件摘要')
    expect(await translateEventOnce(event)).toEqual({
      title: '云端事件标题',
      summary: '云端事件摘要'
    })
    expect(translateText).not.toHaveBeenCalled()
    expect(azureTranslate).toHaveBeenNthCalledWith(1, event.title, false)
    expect(azureTranslate).toHaveBeenNthCalledWith(2, event.summary, false)
  })

  it('falls back for a body when Azure succeeds only for the title', async () => {
    azureTranslate.mockResolvedValueOnce('云端标题').mockResolvedValueOnce(null)
    const result = await translateArticleOnce(article, 'technology')
    expect(result.title).toBe('云端标题')
    expect(result.contentHtml).toContain('中文：')
    expect(translateText).toHaveBeenCalledOnce()
    expect(cache.size).toBe(1)
  })

  it('reuses article translation across sequential requests', async () => {
    const first = await translateArticleOnce(article, 'technology')
    translateText.mockClear()
    expect(await translateArticleOnce(article, 'technology')).toEqual(first)
    expect(translateText).not.toHaveBeenCalled()
  })

  it.each([
    { title: 'An updated guide to building reliable software systems' },
    { contentHtml: '<p>This is revised article content for readers.</p>' },
    { summary: 'An updated summary of this article.' },
    { url: 'https://example.com/posts/revised' }
  ])('does not reuse stale translations after article input changes: %j', async (changes) => {
    await translateArticleOnce(article, 'technology')
    translateText.mockClear()
    await translateArticleOnce({ ...article, ...changes }, 'technology')
    expect(translateText).toHaveBeenCalledTimes(2)
  })

  it('returns cache hits while new translations are at capacity', async () => {
    const cached = await translateEventOnce(event)
    translateText.mockClear()
    let releaseFirst!: (value: string) => void
    let releaseSecond!: (value: string) => void
    translateText
      .mockImplementationOnce(
        () =>
          new Promise<string>((resolve) => {
            releaseFirst = resolve
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise<string>((resolve) => {
            releaseSecond = resolve
          })
      )
    const first = translateArticleOnce(article, 'technology')
    const second = translateArticleOnce({ ...article, id: 'second' }, 'technology')
    try {
      await vi.waitFor(() => expect(translateText).toHaveBeenCalledTimes(2))
      await expect(
        translateArticleOnce({ ...article, id: 'third' }, 'technology')
      ).rejects.toBeInstanceOf(TranslationBusyError)
      expect(await translateEventOnce(event)).toEqual(cached)
    } finally {
      releaseFirst('第一篇译文')
      releaseSecond('第二篇译文')
      await Promise.all([first, second])
    }
  })

  it('caches event translations separately from articles', async () => {
    const first = await translateEventOnce({ ...event, id: article.id })
    await translateArticleOnce(article, 'technology')
    translateText.mockClear()
    expect(await translateEventOnce({ ...event, id: article.id })).toEqual(first)
    expect(translateText).not.toHaveBeenCalled()
  })

  it('shares concurrent requests for the same article', async () => {
    const results = await Promise.all([
      translateArticleOnce(article, 'technology'),
      translateArticleOnce(article, 'technology')
    ])
    expect(results[0]).toEqual(results[1])
    expect(translateText).toHaveBeenCalledTimes(2)
  })

  it('does not cache failed translations and permits retry', async () => {
    translateText.mockRejectedValueOnce(new Error('translation failed'))
    await expect(translateArticleOnce(article, 'technology')).rejects.toThrow('translation failed')
    expect(cache.size).toBe(0)
    expect((await translateArticleOnce(article, 'technology')).title).toBe(`中文：${article.title}`)
  })

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

  it('translates an English event title and summary', async () => {
    const translate = vi.fn(async (text: string) => `中文：${text}`)
    const result = await translateEvent(event, translate)

    expect(translate).toHaveBeenNthCalledWith(1, event.title)
    expect(translate).toHaveBeenNthCalledWith(2, event.summary)
    expect(result).toEqual({
      title: `中文：${event.title}`,
      summary: `中文：${event.summary}`
    })
  })

  it('rejects non-English events before translation', async () => {
    const translate = vi.fn()
    await expect(
      translateEvent(
        { ...event, title: '中文事件标题', summary: '这是一段中文事件摘要。' },
        translate
      )
    ).rejects.toThrow('EVENT_NOT_ENGLISH')
    expect(translate).not.toHaveBeenCalled()
  })
})
