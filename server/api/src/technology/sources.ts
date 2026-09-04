export const technologySources = [
  {
    id: 'github',
    name: 'GitHub Trending',
    rsshubPath: '/github/trending/weekly/any'
  },
  {
    id: 'hacker-news',
    name: 'Hacker News',
    rsshubPath: '/hackernews'
  },
  {
    id: 'juejin',
    name: '掘金',
    rsshubPath: '/juejin/trending/all/weekly'
  },
  {
    id: 'v2ex',
    name: 'V2EX',
    rsshubPath: '/v2ex/topics/hot'
  },
  {
    id: 'ithome',
    name: 'IT之家',
    rsshubPath: '/ithome/ranking/24h'
  },
  {
    id: '36kr',
    name: '36氪',
    rsshubPath: '/36kr/hot-list/24'
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
