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

export const aiSources = [
  {
    id: 'openai',
    code: 'OA',
    name: 'OpenAI',
    shortName: 'OpenAI',
    description: '官方产品、研究与公司动态'
  },
  {
    id: 'anthropic',
    code: 'AN',
    name: 'Anthropic',
    shortName: 'Anthropic',
    description: 'Claude 团队的官方发布与研究'
  },
  {
    id: 'deepseek',
    code: 'DS',
    name: 'DeepSeek',
    shortName: 'DeepSeek',
    description: '模型与服务的官方发布公告'
  },
  {
    id: 'glm',
    code: 'GL',
    name: '智谱 GLM',
    shortName: 'GLM',
    description: 'GLM 模型与开放平台更新'
  },
  {
    id: 'google-ai',
    code: 'GM',
    name: 'Google AI / Gemini',
    shortName: 'Gemini',
    description: 'Google AI 与 Gemini 官方文章'
  },
  {
    id: 'qwen',
    code: 'QW',
    name: 'Qwen',
    shortName: 'Qwen',
    description: '通义千问团队的模型与研究动态'
  }
] as const

export const socialSources = [
  {
    id: 'bilibili',
    code: 'BI',
    name: '哔哩哔哩综合热门',
    shortName: 'B 站',
    description: '全站近期热门视频'
  },
  {
    id: 'zhihu',
    code: 'ZH',
    name: '知乎热榜',
    shortName: '知乎',
    description: '社区当前高热度问题'
  },
  {
    id: 'coolapk',
    code: 'CK',
    name: '酷安热榜',
    shortName: '酷安',
    description: '数码社区的热门讨论'
  },
  {
    id: 'hupu',
    code: 'HP',
    name: '虎扑话题',
    shortName: '虎扑',
    description: '社区每日热门话题'
  },
  {
    id: 'sspai',
    code: 'SP',
    name: '少数派 Matrix',
    shortName: '少数派',
    description: '效率与数字生活社区文章'
  },
  {
    id: 'toutiao',
    code: 'TT',
    name: '今日头条热榜',
    shortName: '头条',
    description: '内容平台实时热门话题'
  }
] as const

export const financeSources = [
  {
    id: 'wallstreetcn',
    code: 'WS',
    name: '华尔街见闻',
    shortName: '见闻',
    description: '当日市场与商业热门文章'
  },
  {
    id: 'cls',
    code: 'CL',
    name: '财联社',
    shortName: '财联社',
    description: '财经新闻热门文章排行榜'
  },
  {
    id: 'jin10',
    code: 'J10',
    name: '金十数据',
    shortName: '金十',
    description: '重要市场快讯时间线'
  },
  {
    id: 'yicai',
    code: 'YC',
    name: '第一财经',
    shortName: '一财',
    description: '编辑精选的财经头条'
  },
  {
    id: 'stcn',
    code: 'ST',
    name: '证券时报',
    shortName: '证券时报',
    description: '证券市场要闻热榜'
  },
  {
    id: '10jqka',
    code: 'TH',
    name: '同花顺财经',
    shortName: '同花顺',
    description: '7×24 小时财经要闻'
  }
] as const

export const gameSources = [
  {
    id: '3dmgame',
    code: '3D',
    name: '3DM 游戏网',
    shortName: '3DM',
    description: '游戏产业与新品资讯'
  },
  {
    id: 'gcores',
    code: 'GC',
    name: '机核',
    shortName: '机核',
    description: '游戏文化与编辑资讯'
  },
  {
    id: 'gamersky',
    code: 'GS',
    name: '游民星空',
    shortName: '游民',
    description: '当天推荐的游戏新闻'
  },
  {
    id: 'ali213',
    code: 'A21',
    name: '游侠网',
    shortName: '游侠',
    description: '最新游戏资讯与行业动态'
  },
  {
    id: 'indienova',
    code: 'IN',
    name: 'indienova',
    shortName: 'indienova',
    description: '独立游戏文章与开发者内容'
  },
  {
    id: 'steam',
    code: 'ST',
    name: 'Steam 热销榜',
    shortName: 'Steam',
    description: '商店热销榜快照，以采集时间表示榜单更新时间'
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
