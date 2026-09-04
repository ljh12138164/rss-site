import { describe, expect, it } from 'vitest'
import {
  getNewsSource,
  getSignalSource,
  getTechnologySource,
  isNewsSourceId,
  isSignalSourceId,
  isTechnologySourceId,
  newsSources,
  signalSources,
  technologySources
} from './sources.js'

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
    expect(technologySources.every((source) => source.section === 'technology')).toBe(true)
  })

  it('registers the six confirmed domestic news feeds', () => {
    expect(newsSources.map(({ id, rsshubPath }) => [id, rsshubPath])).toEqual([
      ['xinhua', '/news/xhsxw?limit=30'],
      ['cctv', '/cctv/china'],
      ['chinanews', '/chinanews?limit=30'],
      ['thepaper', '/thepaper/sidebar/hotNews'],
      ['jiemian', '/jiemian/lists/71'],
      ['baidu', '/baidu/top/realtime']
    ])
    expect(newsSources.every((source) => source.section === 'news')).toBe(true)
    expect(newsSources.every((source) => source.itemLimit === 30)).toBe(true)
  })

  it('narrows and resolves only known sources', () => {
    expect(isTechnologySourceId('36kr')).toBe(true)
    expect(isTechnologySourceId('product-hunt')).toBe(false)
    expect(getTechnologySource('juejin').name).toBe('掘金')
    expect(isNewsSourceId('xinhua')).toBe(true)
    expect(isNewsSourceId('github')).toBe(false)
    expect(getNewsSource('thepaper').name).toBe('澎湃热榜')
    expect(isSignalSourceId('baidu')).toBe(true)
    expect(signalSources).toHaveLength(12)
    expect(getSignalSource('cctv').section).toBe('news')
  })
})
