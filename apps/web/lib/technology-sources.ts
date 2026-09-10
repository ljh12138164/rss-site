export const technologySources = [
  {
    id: 'github',
    code: 'GH',
    name: 'GitHub Trending',
    shortName: '开源榜',
    description: '每周热门中文开源项目'
  },
  {
    id: 'hacker-news',
    code: 'HN',
    name: 'Hacker News',
    shortName: 'Hacker News',
    description: '热门技术讨论'
  },
  {
    id: 'juejin',
    code: 'JJ',
    name: '掘金',
    shortName: '掘金',
    description: '本周热门文章'
  },
  {
    id: 'v2ex',
    code: 'V2',
    name: 'V2EX',
    shortName: 'V2EX',
    description: '当前热门话题'
  },
  {
    id: 'ithome',
    code: 'IT',
    name: 'IT之家',
    shortName: 'IT之家',
    description: '热门科技资讯'
  },
  {
    id: '36kr',
    code: '36',
    name: '36氪',
    shortName: '36氪',
    description: '科技与商业热门资讯'
  },
  {
    id: 'github-blog',
    code: 'GH',
    name: 'GitHub Blog',
    shortName: 'GitHub Blog',
    description: 'GitHub 官方文章与产品动态'
  }
] as const

export const technologyArticleSources = technologySources.filter((source) => source.id !== 'github')

export const newsSources = [
  {
    id: 'xinhua',
    code: 'XH',
    name: '新华社',
    shortName: '新华社',
    description: '新华网新闻'
  },
  {
    id: 'cctv',
    code: 'TV',
    name: '央视国内',
    shortName: '央视',
    description: '央视国内新闻'
  },
  {
    id: 'chinanews',
    code: 'CN',
    name: '中国新闻网',
    shortName: '中新网',
    description: '中新网滚动新闻'
  },
  {
    id: 'thepaper',
    code: 'PP',
    name: '澎湃热榜',
    shortName: '澎湃',
    description: '澎湃新闻热榜'
  },
  {
    id: 'jiemian',
    code: 'JM',
    name: '界面中国',
    shortName: '界面',
    description: '界面新闻中国频道'
  },
  {
    id: 'baidu',
    code: 'BD',
    name: '百度热搜',
    shortName: '百度',
    description: '百度实时热搜'
  }
] as const

export const aiSources = [
  {
    id: 'openai',
    code: 'OA',
    name: 'OpenAI',
    shortName: 'OpenAI',
    description: '官方文章'
  },
  {
    id: 'anthropic',
    code: 'AN',
    name: 'Anthropic',
    shortName: 'Anthropic',
    description: '官方文章与研究'
  },
  {
    id: 'deepseek',
    code: 'DS',
    name: 'DeepSeek',
    shortName: 'DeepSeek',
    description: '官方公告'
  },
  {
    id: 'glm',
    code: 'GL',
    name: '智谱 GLM',
    shortName: 'GLM',
    description: '模型与平台更新'
  },
  {
    id: 'google-ai',
    code: 'GM',
    name: 'Google AI / Gemini',
    shortName: 'Gemini',
    description: '官方文章'
  },
  {
    id: 'qwen',
    code: 'QW',
    name: 'Qwen',
    shortName: 'Qwen',
    description: '官方文章与研究'
  }
] as const

export const socialSources = [
  {
    id: 'bilibili',
    code: 'BI',
    name: '哔哩哔哩综合热门',
    shortName: 'B 站',
    description: '全站热门视频'
  },
  {
    id: 'zhihu',
    code: 'ZH',
    name: '知乎热榜',
    shortName: '知乎',
    description: '知乎热门问题'
  },
  {
    id: 'coolapk',
    code: 'CK',
    name: '酷安热榜',
    shortName: '酷安',
    description: '数码与科技讨论'
  },
  {
    id: 'hupu',
    code: 'HP',
    name: '虎扑话题',
    shortName: '虎扑',
    description: '热门社区话题'
  },
  {
    id: 'sspai',
    code: 'SP',
    name: '少数派 Matrix',
    shortName: '少数派',
    description: '数字生活社区文章'
  },
  {
    id: 'toutiao',
    code: 'TT',
    name: '今日头条热榜',
    shortName: '头条',
    description: '今日头条热门话题'
  }
] as const

export const financeSources = [
  {
    id: 'wallstreetcn',
    code: 'WS',
    name: '华尔街见闻',
    shortName: '见闻',
    description: '市场与商业热门文章'
  },
  {
    id: 'cls',
    code: 'CL',
    name: '财联社',
    shortName: '财联社',
    description: '热门财经新闻'
  },
  {
    id: 'jin10',
    code: 'J10',
    name: '金十数据',
    shortName: '金十',
    description: '市场快讯'
  },
  {
    id: 'yicai',
    code: 'YC',
    name: '第一财经',
    shortName: '一财',
    description: '财经头条'
  },
  {
    id: 'stcn',
    code: 'ST',
    name: '证券时报',
    shortName: '证券时报',
    description: '证券市场要闻'
  },
  {
    id: '10jqka',
    code: 'TH',
    name: '同花顺财经',
    shortName: '同花顺',
    description: '财经要闻'
  }
] as const

export const gameSources = [
  {
    id: '3dmgame',
    code: '3D',
    name: '3DM 游戏网',
    shortName: '3DM',
    description: '游戏新闻与新品资讯'
  },
  {
    id: 'gcores',
    code: 'GC',
    name: '机核',
    shortName: '机核',
    description: '游戏文化与编辑文章'
  },
  {
    id: 'gamersky',
    code: 'GS',
    name: '游民星空',
    shortName: '游民',
    description: '热门游戏新闻'
  },
  {
    id: 'ali213',
    code: 'A21',
    name: '游侠网',
    shortName: '游侠',
    description: '游戏资讯与行业动态'
  },
  {
    id: 'indienova',
    code: 'IN',
    name: 'indienova',
    shortName: 'indienova',
    description: '独立游戏与开发者文章'
  },
  {
    id: 'steam',
    code: 'ST',
    name: 'Steam 热销榜',
    shortName: 'Steam',
    description: 'Steam 商店热销榜'
  }
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
export type SignalSource =
  | TechnologySource
  | NewsSource
  | AiSource
  | SocialSource
  | FinanceSource
  | GameSource
export type SignalSourceId = SignalSource['id']

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
