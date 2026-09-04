export const technologySources = [
  {
    id: 'github',
    code: 'GH',
    name: 'GitHub Trending',
    shortName: 'GitHub',
    description: '开源项目的周度热度信号'
  },
  {
    id: 'hacker-news',
    code: 'HN',
    name: 'Hacker News',
    shortName: 'Hacker News',
    description: '技术社区正在讨论的链接'
  },
  {
    id: 'juejin',
    code: 'JJ',
    name: '掘金',
    shortName: '掘金',
    description: '中文开发者社区的周榜文章'
  },
  {
    id: 'v2ex',
    code: 'V2',
    name: 'V2EX',
    shortName: 'V2EX',
    description: '社区此刻最活跃的话题'
  },
  {
    id: 'ithome',
    code: 'IT',
    name: 'IT之家',
    shortName: 'IT之家',
    description: '消费科技与行业新闻排行'
  },
  {
    id: '36kr',
    code: '36',
    name: '36氪',
    shortName: '36氪',
    description: '科技商业与创业动态热榜'
  }
] as const

export const newsSources = [
  {
    id: 'xinhua',
    code: 'XH',
    name: '新华社',
    shortName: '新华社',
    description: '新华网综合新闻列表'
  },
  {
    id: 'cctv',
    code: 'TV',
    name: '央视国内',
    shortName: '央视',
    description: '央视新闻国内频道'
  },
  {
    id: 'chinanews',
    code: 'CN',
    name: '中国新闻网',
    shortName: '中新网',
    description: '中新社滚动新闻'
  },
  {
    id: 'thepaper',
    code: 'PP',
    name: '澎湃热榜',
    shortName: '澎湃',
    description: '澎湃新闻当前热榜'
  },
  {
    id: 'jiemian',
    code: 'JM',
    name: '界面中国',
    shortName: '界面',
    description: '界面新闻中国栏目'
  },
  {
    id: 'baidu',
    code: 'BD',
    name: '百度热搜',
    shortName: '百度',
    description: '全网实时搜索趋势'
  }
] as const

export type TechnologySource = (typeof technologySources)[number]
export type TechnologySourceId = TechnologySource['id']
export type NewsSource = (typeof newsSources)[number]
export type NewsSourceId = NewsSource['id']
export type SignalSource = TechnologySource | NewsSource
export type SignalSourceId = SignalSource['id']

export function isTechnologySourceId(value: string): value is TechnologySourceId {
  return technologySources.some((source) => source.id === value)
}

export function isNewsSourceId(value: string): value is NewsSourceId {
  return newsSources.some((source) => source.id === value)
}

export function getTechnologySource(id: TechnologySourceId): TechnologySource {
  const source = technologySources.find((candidate) => candidate.id === id)
  if (!source) throw new Error(`Unknown technology source: ${id}`)
  return source
}

export function getNewsSource(id: NewsSourceId): NewsSource {
  const source = newsSources.find((candidate) => candidate.id === id)
  if (!source) throw new Error(`Unknown news source: ${id}`)
  return source
}
