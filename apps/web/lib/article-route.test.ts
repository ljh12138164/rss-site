import { describe, expect, it } from 'vitest'
import {
  articleSections,
  createArticlePath,
  createNewsArticlePath,
  MAX_ENCODED_ARTICLE_SLUG_BYTES,
  normalizeArticleSlugSegment,
  parseArticleIdFromSlug
} from './article-route'

describe('news article routes', () => {
  const id = '550e8400-e29b-41d4-a716-446655440000'

  it('routes every registered source to its own section detail', () => {
    for (const section of articleSections) {
      for (const source of section.sources) {
        expect(createArticlePath(source.id, '文章', id)).toBe(
          `/${section.id}/${source.id}/文章--${id}`
        )
      }
    }
    expect(() => createArticlePath('unknown', '文章', id)).toThrow()
  })

  it('keeps a readable title while using the UUID as the stable suffix', () => {
    expect(createNewsArticlePath('xinhua', ' 新华社：AI 产业新进展！ ', id)).toBe(
      `/news/xinhua/新华社-ai-产业新进展--${id}`
    )
  })

  it('extracts the stable UUID even if the readable title changes', () => {
    expect(parseArticleIdFromSlug(`后来修改的标题--${id}`)).toBe(id)
  })

  it('rejects malformed slugs', () => {
    expect(parseArticleIdFromSlug('article--not-an-id')).toBeNull()
    expect(parseArticleIdFromSlug(id)).toBeNull()
  })

  it('caps encoded Chinese slug length below Linux filename limits', () => {
    const longTitle =
      '数码日常感觉国内的厂商在故意不给更新啊适配的好慢同样的抖音海外早适配了国内还公测呢真让人无语'
    const path = createArticlePath('coolapk', longTitle, id)
    const slug = path.split('/').at(-1) ?? ''
    expect(encodeURIComponent(slug).length).toBeLessThanOrEqual(MAX_ENCODED_ARTICLE_SLUG_BYTES)
    expect(parseArticleIdFromSlug(slug)).toBe(id)
    expect(slug.startsWith('数码日常')).toBe(true)
  })

  it('normalizes multi-encoded and overly long slugs into canonical redirect targets', () => {
    const single = encodeURIComponent(`邓超演唱会公开告白孙俪--${id}`)
    const triple = encodeURIComponent(encodeURIComponent(single))
    const normalized = normalizeArticleSlugSegment(triple)
    expect(normalized).toEqual({
      kind: 'redirect',
      id,
      canonicalSlug: `邓超演唱会公开告白孙俪--${id}`,
      canonicalEncoded: single
    })

    const longRaw = encodeURIComponent(
      `赋能产业发展-提升民生温度-乡村建设-进度条-刷新农村生产生活条件持续改善-更多详细报道内容--${id}`
    )
    expect(longRaw.length).toBeGreaterThan(MAX_ENCODED_ARTICLE_SLUG_BYTES)
    const shortened = normalizeArticleSlugSegment(longRaw)
    expect(shortened.kind).toBe('redirect')
    if (shortened.kind === 'redirect') {
      expect(shortened.canonicalEncoded.length).toBeLessThanOrEqual(MAX_ENCODED_ARTICLE_SLUG_BYTES)
      expect(normalizeArticleSlugSegment(shortened.canonicalEncoded).kind).toBe('ok')
    }
  })

  it('rejects excessively nested percent-encoding without looping', () => {
    let nested = encodeURIComponent(`测试--${id}`)
    for (let i = 0; i < 25; i += 1) nested = encodeURIComponent(nested)
    expect(normalizeArticleSlugSegment(nested)).toEqual({ kind: 'invalid' })
  })
})
