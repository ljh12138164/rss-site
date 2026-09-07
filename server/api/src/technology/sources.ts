export const technologySources = [
  {
    id: 'github',
    name: 'GitHub Trending',
    rsshubPath: '/github/trending/weekly/any',
    section: 'technology',
    itemLimit: 30
  },
  {
    id: 'hacker-news',
    name: 'Hacker News',
    rsshubPath: '/hackernews',
    section: 'technology',
    itemLimit: 30
  },
  {
    id: 'juejin',
    name: '掘金',
    rsshubPath: '/juejin/trending/all/weekly',
    section: 'technology',
    itemLimit: 30
  },
  {
    id: 'v2ex',
    name: 'V2EX',
    rsshubPath: '/v2ex/topics/hot',
    section: 'technology',
    itemLimit: 30
  },
  {
    id: 'ithome',
    name: 'IT之家',
    rsshubPath: '/ithome/ranking/24h',
    section: 'technology',
    itemLimit: 30
  },
  {
    id: '36kr',
    name: '36氪',
    rsshubPath: '/36kr/hot-list/24',
    section: 'technology',
    itemLimit: 30
  },
  {
    id: 'github-blog',
    name: 'GitHub Blog',
    feedUrl: 'https://github.blog/feed/',
    section: 'technology',
    itemLimit: 30
  }
] as const

export const newsSources = [
  {
    id: 'xinhua',
    name: '新华社',
    rsshubPath: '/news/xhsxw?limit=30',
    section: 'news',
    itemLimit: 30
  },
  {
    id: 'cctv',
    name: '央视国内',
    rsshubPath: '/cctv/china',
    section: 'news',
    itemLimit: 30
  },
  {
    id: 'chinanews',
    name: '中国新闻网',
    rsshubPath: '/chinanews?limit=30',
    section: 'news',
    itemLimit: 30
  },
  {
    id: 'thepaper',
    name: '澎湃热榜',
    rsshubPath: '/thepaper/sidebar/hotNews',
    section: 'news',
    itemLimit: 30
  },
  {
    id: 'jiemian',
    name: '界面中国',
    rsshubPath: '/jiemian/lists/71',
    section: 'news',
    itemLimit: 30
  },
  {
    id: 'baidu',
    name: '百度热搜',
    rsshubPath: '/baidu/top/realtime',
    section: 'news',
    itemLimit: 30
  }
] as const

export const aiSources = [
  {
    id: 'openai',
    name: 'OpenAI',
    rsshubPath: '/openai/news?limit=20',
    section: 'ai',
    itemLimit: 20
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    rsshubPath: '/anthropic/news?limit=20',
    section: 'ai',
    itemLimit: 20
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    rsshubPath: '/deepseek/news',
    section: 'ai',
    itemLimit: 20
  },
  {
    id: 'glm',
    name: '智谱 GLM',
    feedUrl: 'https://docs.bigmodel.cn/cn/update/new-releases/rss.xml',
    section: 'ai',
    itemLimit: 20,
    titleFromFirstStrong: true
  },
  {
    id: 'google-ai',
    name: 'Google AI / Gemini',
    feedUrl: 'https://blog.google/innovation-and-ai/technology/ai/rss/',
    section: 'ai',
    itemLimit: 20
  },
  {
    id: 'qwen',
    name: 'Qwen',
    rsshubPath: '/qwen/blog/zh-CN',
    section: 'ai',
    itemLimit: 20
  }
] as const

export const socialSources = [
  {
    id: 'bilibili',
    name: '哔哩哔哩综合热门',
    rsshubPath: '/bilibili/popular/all',
    section: 'social',
    itemLimit: 30
  },
  {
    id: 'zhihu',
    name: '知乎热榜',
    rsshubPath: '/zhihu/hot',
    section: 'social',
    itemLimit: 30
  },
  {
    id: 'coolapk',
    name: '酷安热榜',
    rsshubPath: '/coolapk/hot',
    section: 'social',
    itemLimit: 30
  },
  {
    id: 'hupu',
    name: '虎扑话题',
    rsshubPath: '/hupu/all/topic-daily',
    section: 'social',
    itemLimit: 30
  },
  {
    id: 'sspai',
    name: '少数派 Matrix',
    rsshubPath: '/sspai/matrix',
    section: 'social',
    itemLimit: 30
  },
  {
    id: 'toutiao',
    name: '今日头条热榜',
    rsshubPath: '/toutiao/channel/news_hot',
    section: 'social',
    itemLimit: 30
  }
] as const

export const financeSources = [
  {
    id: 'wallstreetcn',
    name: '华尔街见闻',
    rsshubPath: '/wallstreetcn/hot/day',
    section: 'finance',
    itemLimit: 30
  },
  {
    id: 'cls',
    name: '财联社',
    rsshubPath: '/cls/hot?limit=20',
    section: 'finance',
    itemLimit: 30
  },
  {
    id: 'jin10',
    name: '金十数据',
    rsshubPath: '/jin10/important',
    section: 'finance',
    itemLimit: 30
  },
  {
    id: 'yicai',
    name: '第一财经',
    rsshubPath: '/yicai/headline',
    section: 'finance',
    itemLimit: 30
  },
  {
    id: 'stcn',
    name: '证券时报',
    rsshubPath: '/stcn/article/rank/yw',
    section: 'finance',
    itemLimit: 30
  },
  {
    id: '10jqka',
    name: '同花顺财经',
    rsshubPath: '/10jqka/realtimenews',
    section: 'finance',
    itemLimit: 30
  }
] as const

export const gameSources = [
  {
    id: '3dmgame',
    name: '3DM 游戏网',
    rsshubPath: '/3dmgame/news/game',
    section: 'games',
    itemLimit: 30
  },
  {
    id: 'gcores',
    name: '机核',
    rsshubPath: '/gcores/news?limit=20',
    section: 'games',
    itemLimit: 30
  },
  {
    id: 'gamersky',
    name: '游民星空',
    rsshubPath: '/gamersky/news',
    section: 'games',
    itemLimit: 30
  },
  {
    id: 'ali213',
    name: '游侠网',
    rsshubPath: '/ali213/news/new',
    section: 'games',
    itemLimit: 30
  },
  {
    id: 'indienova',
    name: 'indienova',
    rsshubPath: '/indienova/article',
    section: 'games',
    itemLimit: 30
  },
  {
    id: 'steam',
    name: 'Steam 热销榜',
    rsshubPath: '/steam/search/filter=topsellers',
    section: 'games',
    itemLimit: 30
  }
] as const

export const signalSources = [
  ...technologySources,
  ...newsSources,
  ...aiSources,
  ...socialSources,
  ...financeSources,
  ...gameSources
] as const

export type TechnologySource = (typeof technologySources)[number]
export type TechnologySourceId = TechnologySource['id']
export type NewsSource = (typeof newsSources)[number]
export type NewsSourceId = NewsSource['id']
export type AiSource = (typeof aiSources)[number]
export type AiSourceId = AiSource['id']
export type SocialSource = (typeof socialSources)[number]
export type SocialSourceId = SocialSource['id']
export type FinanceSource = (typeof financeSources)[number]
export type FinanceSourceId = FinanceSource['id']
export type GameSource = (typeof gameSources)[number]
export type GameSourceId = GameSource['id']
export type SignalSource = (typeof signalSources)[number]
export type SignalSourceId = SignalSource['id']
export type SignalSection = SignalSource['section']

export function isTechnologySourceId(value: string): value is TechnologySourceId {
  return technologySources.some((source) => source.id === value)
}

export function isNewsSourceId(value: string): value is NewsSourceId {
  return newsSources.some((source) => source.id === value)
}

export function isAiSourceId(value: string): value is AiSourceId {
  return aiSources.some((source) => source.id === value)
}

export function isSocialSourceId(value: string): value is SocialSourceId {
  return socialSources.some((source) => source.id === value)
}

export function isFinanceSourceId(value: string): value is FinanceSourceId {
  return financeSources.some((source) => source.id === value)
}

export function isGameSourceId(value: string): value is GameSourceId {
  return gameSources.some((source) => source.id === value)
}

export function isSignalSourceId(value: string): value is SignalSourceId {
  return signalSources.some((source) => source.id === value)
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

export function getAiSource(id: AiSourceId): AiSource {
  const source = aiSources.find((candidate) => candidate.id === id)
  if (!source) throw new Error(`Unknown AI source: ${id}`)
  return source
}

export function getSocialSource(id: SocialSourceId): SocialSource {
  const source = socialSources.find((candidate) => candidate.id === id)
  if (!source) throw new Error(`Unknown social source: ${id}`)
  return source
}

export function getFinanceSource(id: FinanceSourceId): FinanceSource {
  const source = financeSources.find((candidate) => candidate.id === id)
  if (!source) throw new Error(`Unknown finance source: ${id}`)
  return source
}

export function getGameSource(id: GameSourceId): GameSource {
  const source = gameSources.find((candidate) => candidate.id === id)
  if (!source) throw new Error(`Unknown game source: ${id}`)
  return source
}

export function getSignalSource(id: SignalSourceId): SignalSource {
  const source = signalSources.find((candidate) => candidate.id === id)
  if (!source) throw new Error(`Unknown signal source: ${id}`)
  return source
}

export function resolveSignalFeedUrl(source: SignalSource, rsshubBaseUrl: string): string {
  return 'feedUrl' in source ? source.feedUrl : `${rsshubBaseUrl}${source.rsshubPath}`
}
