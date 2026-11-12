import { describe, expect, it } from 'vitest'
import { articleSections, createArticlePath, parseArticleIdFromSlug } from './article-route'

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

  it('extracts the stable UUID even if the readable title changes', () => {
    expect(parseArticleIdFromSlug(`后来修改的标题--${id}`)).toBe(id)
  })

  it('rejects malformed slugs', () => {
    expect(parseArticleIdFromSlug('article--not-an-id')).toBeNull()
    expect(parseArticleIdFromSlug(id)).toBeNull()
  })
})
