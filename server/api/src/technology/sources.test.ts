import { describe, expect, it } from 'vitest'
import {
  aiSources,
  financeSources,
  gameSources,
  getAiSource,
  getFinanceSource,
  getGameSource,
  getNewsSource,
  getSignalSource,
  getSocialSource,
  getTechnologySource,
  isAiSourceId,
  isFinanceSourceId,
  isGameSourceId,
  isNewsSourceId,
  isSignalSourceId,
  isSocialSourceId,
  isTechnologySourceId,
  newsSources,
  resolveSignalFeedUrl,
  signalSources,
  socialSources,
  technologySources
} from './sources.js'

describe('technologySources', () => {
  it('keeps the confirmed sources and RSSHub paths in display order', () => {
    expect(
      technologySources.map((source) => [source.id, resolveSignalFeedUrl(source, '')])
    ).toEqual([
      ['github', '/github/trending/weekly/any/zh'],
      ['hacker-news', '/hackernews'],
      ['juejin', '/juejin/trending/all/weekly'],
      ['ithome', '/ithome/ranking/24h'],
      ['36kr', '/36kr/hot-list/24'],
      ['github-blog', 'https://github.blog/feed/']
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

  it('registers six official AI platform feeds without accepting arbitrary URLs', () => {
    expect(aiSources.map(({ id }) => id)).toEqual([
      'openai',
      'anthropic',
      'deepseek',
      'glm',
      'google-ai',
      'qwen'
    ])
    expect(aiSources.every((source) => source.section === 'ai')).toBe(true)
    expect(getAiSource('glm')).toMatchObject({
      feedUrl: 'https://docs.bigmodel.cn/cn/update/new-releases/rss.xml',
      titleFromFirstStrong: true,
      urlFromFirstAnchor: true
    })
    expect(getAiSource('google-ai')).toMatchObject({
      feedUrl: 'https://blog.google/innovation-and-ai/technology/ai/rss/'
    })
    expect(getAiSource('openai')).toMatchObject({ rsshubPath: '/openai/news?limit=20' })
    expect(resolveSignalFeedUrl(getAiSource('openai'), 'https://rss.example')).toBe(
      'https://rss.example/openai/news?limit=20'
    )
    expect(resolveSignalFeedUrl(getAiSource('glm'), 'https://rss.example')).toBe(
      'https://docs.bigmodel.cn/cn/update/new-releases/rss.xml'
    )
  })

  it('registers six anonymous social feeds in display order', () => {
    expect(socialSources.map(({ id, rsshubPath }) => [id, rsshubPath])).toEqual([
      ['bilibili', '/bilibili/popular/all'],
      ['zhihu', '/zhihu/hot'],
      ['coolapk', '/coolapk/hot'],
      ['hupu', '/hupu/all/topic-daily'],
      ['sspai', '/sspai/matrix'],
      ['toutiao', '/toutiao/channel/news_hot']
    ])
    expect(socialSources.every((source) => source.section === 'social')).toBe(true)
    expect(getSocialSource('bilibili').name).toBe('哔哩哔哩综合热门')
  })

  it('registers five anonymous finance feeds with publication times', () => {
    expect(financeSources.map(({ id, rsshubPath }) => [id, rsshubPath])).toEqual([
      ['wallstreetcn', '/wallstreetcn/hot/day'],
      ['cls', '/cls/hot?limit=20'],
      ['jin10', '/jin10/topic/343'],
      ['yicai', '/yicai/headline'],
      ['stcn', '/stcn/article/list/yw']
    ])
    expect(financeSources.every((source) => source.section === 'finance')).toBe(true)
    expect(getFinanceSource('wallstreetcn').name).toBe('华尔街见闻')
  })

  it('registers five anonymous game feeds', () => {
    expect(gameSources.map(({ id, rsshubPath }) => [id, rsshubPath])).toEqual([
      ['3dmgame', '/3dmgame/news/game'],
      ['gcores', '/gcores/news?limit=20'],
      ['gamersky', '/gamersky/news'],
      ['ali213', '/ali213/news/new'],
      ['indienova', '/indienova/article']
    ])
    expect(gameSources.every((source) => source.section === 'games')).toBe(true)
    expect(getGameSource('gcores').name).toBe('机核')
  })

  it('narrows and resolves only known sources', () => {
    expect(isTechnologySourceId('36kr')).toBe(true)
    expect(isTechnologySourceId('product-hunt')).toBe(false)
    expect(getTechnologySource('juejin').name).toBe('掘金')
    expect(isNewsSourceId('xinhua')).toBe(true)
    expect(isNewsSourceId('github')).toBe(false)
    expect(getNewsSource('thepaper').name).toBe('澎湃热榜')
    expect(isAiSourceId('deepseek')).toBe(true)
    expect(isAiSourceId('github')).toBe(false)
    expect(isSignalSourceId('baidu')).toBe(true)
    expect(isSocialSourceId('bilibili')).toBe(true)
    expect(isSocialSourceId('weibo')).toBe(false)
    expect(isFinanceSourceId('jin10')).toBe(true)
    expect(isFinanceSourceId('github')).toBe(false)
    expect(isGameSourceId('steam')).toBe(false)
    expect(isGameSourceId('github')).toBe(false)
    expect(signalSources).toHaveLength(34)
    expect(getSignalSource('cctv').section).toBe('news')
  })
})
