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

export type TechnologySource = (typeof technologySources)[number]
export type TechnologySourceId = TechnologySource['id']

export function isTechnologySourceId(value: string): value is TechnologySourceId {
  return technologySources.some((source) => source.id === value)
}

export function getTechnologySource(id: TechnologySourceId): TechnologySource {
  const source = technologySources.find((candidate) => candidate.id === id)
  if (!source) throw new Error(`Unknown technology source: ${id}`)
  return source
}
