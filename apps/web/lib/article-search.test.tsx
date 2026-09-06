import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Highlight } from '../components/article-search'
import { searchExcerpt, searchFilter, searchValidation } from './article-search'

describe('article search', () => {
  it('validates query bounds', () => {
    for (const query of ['', '中', 'a'.repeat(81), 'a*'])
      expect(searchValidation(query)).toBeTruthy()
    expect(searchValidation('模型')).toBeNull()
    expect(searchValidation('C++')).toBeNull()
  })
  it('quotes reserved filter characters', () => {
    expect(searchFilter('a,b"')).toBe('title.ilike."%a,b\\"%",summary.ilike."%a,b\\"%"')
    expect(searchFilter('10%')).toBe('title.ilike."%10\\\\%%",summary.ilike."%10\\\\%%"')
  })
  it('includes matches deep in a summary', () => {
    const excerpt = searchExcerpt(`${'前'.repeat(300)}模型${'后'.repeat(300)}`, '模型')
    expect(excerpt).toContain('模型')
    expect(excerpt.startsWith('…')).toBe(true)
    expect(excerpt.length).toBeLessThan(200)
  })
  it('highlights literals and escapes HTML', () => {
    const html = renderToStaticMarkup(<Highlight text="<script>C++ C++</script>" query="C++" />)
    expect(html.match(/<mark /g)).toHaveLength(2)
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
  })
})
