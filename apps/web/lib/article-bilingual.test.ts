import { describe, expect, it } from 'vitest'
import { pairBilingualBlocks } from './article-bilingual'

describe('pairBilingualBlocks', () => {
  it('pairs corresponding HTML paragraph blocks', () => {
    const orig = '<p>First paragraph.</p><p>Second paragraph.</p>'
    const trans = '<p>第一段。</p><p>第二段。</p>'

    const pairs = pairBilingualBlocks(orig, trans)
    expect(pairs).toHaveLength(2)
    expect(pairs[0]).toEqual({
      id: 'pair-0',
      original: '<p>First paragraph.</p>',
      translated: '<p>第一段。</p>'
    })
    expect(pairs[1]).toEqual({
      id: 'pair-1',
      original: '<p>Second paragraph.</p>',
      translated: '<p>第二段。</p>'
    })
  })

  it('handles headings, blockquotes, and lists', () => {
    const orig = '<h2>Section Title</h2><blockquote>Quote here</blockquote>'
    const trans = '<h2>章节标题</h2><blockquote>此处为引用</blockquote>'

    const pairs = pairBilingualBlocks(orig, trans)
    expect(pairs).toHaveLength(2)
    expect(pairs[0].original).toBe('<h2>Section Title</h2>')
    expect(pairs[0].translated).toBe('<h2>章节标题</h2>')
    expect(pairs[1].original).toBe('<blockquote>Quote here</blockquote>')
    expect(pairs[1].translated).toBe('<blockquote>此处为引用</blockquote>')
  })

  it('handles length mismatch gracefully', () => {
    const orig = '<p>P1</p><p>P2</p>'
    const trans = '<p>P1 翻译</p>'

    const pairs = pairBilingualBlocks(orig, trans)
    expect(pairs).toHaveLength(2)
    expect(pairs[0]).toEqual({ id: 'pair-0', original: '<p>P1</p>', translated: '<p>P1 翻译</p>' })
    expect(pairs[1]).toEqual({ id: 'pair-1', original: '<p>P2</p>', translated: '' })
  })

  it('handles empty inputs', () => {
    expect(pairBilingualBlocks('', '')).toEqual([])
    expect(pairBilingualBlocks('<p>Hello</p>', '')).toEqual([
      { id: 'pair-0', original: '<p>Hello</p>', translated: '' }
    ])
    expect(pairBilingualBlocks('', '<p>你好</p>')).toEqual([
      { id: 'pair-0', original: '', translated: '<p>你好</p>' }
    ])
  })
})
