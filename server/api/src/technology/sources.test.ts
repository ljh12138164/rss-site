import { describe, expect, it } from 'vitest'
import { getTechnologySource, isTechnologySourceId, technologySources } from './sources.js'

describe('technologySources', () => {
  it('keeps the confirmed sources and RSSHub paths in display order', () => {
    expect(technologySources.map(({ id, rsshubPath }) => [id, rsshubPath])).toEqual([
      ['github', '/github/trending/weekly/any'],
      ['hacker-news', '/hackernews'],
      ['juejin', '/juejin/trending/all/weekly'],
      ['v2ex', '/v2ex/topics/hot'],
      ['ithome', '/ithome/ranking/24h'],
      ['36kr', '/36kr/hot-list/24']
    ])
  })

  it('narrows and resolves only known sources', () => {
    expect(isTechnologySourceId('36kr')).toBe(true)
    expect(isTechnologySourceId('product-hunt')).toBe(false)
    expect(getTechnologySource('juejin').name).toBe('掘金')
  })
})
