export const signalSectionIds = [
  'technology',
  'skills',
  'news',
  'ai',
  'social',
  'finance',
  'games'
] as const

export type SignalSectionId = (typeof signalSectionIds)[number]
export type SignalSection = SignalSectionId

export interface SignalSectionConfig {
  id: SignalSectionId
  title: string
  shortTitle: string
  description: string
  path: string
  hasArticles: boolean
  hasRss: boolean
}

export const signalSections: readonly SignalSectionConfig[] = [
  {
    id: 'ai',
    title: 'AI',
    shortTitle: 'AI',
    description: 'OpenAI、ChatGPT、Anthropic、DeepSeek、GLM、Gemini 与 Qwen 的官方动态',
    path: '/ai',
    hasArticles: true,
    hasRss: true
  },
  {
    id: 'technology',
    title: '科技',
    shortTitle: '科技',
    description: '开发者社区、开源项目与科技媒体的当前热点',
    path: '/technology',
    hasArticles: true,
    hasRss: true
  },
  {
    id: 'news',
    title: '国内新闻',
    shortTitle: '新闻',
    description: '新华社、央视、中新网、澎湃、界面和百度的新闻与热榜',
    path: '/news',
    hasArticles: true,
    hasRss: true
  },
  {
    id: 'social',
    title: '社交热点',
    shortTitle: '社交',
    description: '视频、问答与社区平台的当前热门内容',
    path: '/social',
    hasArticles: true,
    hasRss: true
  },
  {
    id: 'finance',
    title: '财经',
    shortTitle: '财经',
    description: '市场快讯、商业新闻与财经媒体的当前热点',
    path: '/finance',
    hasArticles: true,
    hasRss: true
  },
  {
    id: 'games',
    title: '游戏',
    shortTitle: '游戏',
    description: '游戏媒体、编辑内容与商店榜单的当前条目',
    path: '/games',
    hasArticles: true,
    hasRss: true
  },
  {
    id: 'skills',
    title: 'Skills 排行榜',
    shortTitle: 'Skills',
    description: '当前热门与增长最快的 AI Agent Skills',
    path: '/skills',
    hasArticles: false,
    hasRss: false
  }
] as const

// 科技 Technology (8)
export const technologySources = [
  {
    id: 'github',
    name: 'GitHub Trending',
    code: 'GH',
    shortName: '开源榜',
    description: '每周热门中文开源项目',
    section: 'technology',
    itemLimit: 30,
    rsshubPath: '/github/trending/weekly/any/zh',
    isArticle: false,
    cronSchedule: '30 0,6,12,18 * * *',
    cronJobName: 'signal-ingest-github'
  },
  {
    id: 'hacker-news',
    name: 'Hacker News',
    code: 'HN',
    shortName: 'Hacker News',
    description: '热门技术讨论',
    section: 'technology',
    itemLimit: 30,
    rsshubPath: '/hackernews',
    isArticle: true,
    cronSchedule: '35 0,6,12,18 * * *',
    cronJobName: 'signal-ingest-hacker-news'
  },
  {
    id: 'juejin',
    name: '掘金',
    code: 'JJ',
    shortName: '掘金',
    description: '本周热门文章',
    section: 'technology',
    itemLimit: 30,
    rsshubPath: '/juejin/trending/all/weekly',
    isArticle: true,
    cronSchedule: '40 0,6,12,18 * * *',
    cronJobName: 'signal-ingest-juejin'
  },
  {
    id: 'ithome',
    name: 'IT之家',
    code: 'IT',
    shortName: 'IT之家',
    description: '热门科技资讯',
    section: 'technology',
    itemLimit: 30,
    rsshubPath: '/ithome/ranking/24h',
    isArticle: true,
    cronSchedule: '50 0,6,12,18 * * *',
    cronJobName: 'signal-ingest-ithome'
  },
  {
    id: '36kr',
    name: '36氪',
    code: '36',
    shortName: '36氪',
    description: '科技与商业热门资讯',
    section: 'technology',
    itemLimit: 30,
    rsshubPath: '/36kr/hot-list/24',
    isArticle: true,
    cronSchedule: '55 0,6,12,18 * * *',
    cronJobName: 'signal-ingest-36kr'
  },
  {
    id: 'github-blog',
    name: 'GitHub Blog',
    code: 'GH',
    shortName: 'GitHub Blog',
    description: 'GitHub 官方文章与产品动态',
    section: 'technology',
    itemLimit: 30,
    feedUrl: 'https://github.blog/feed/',
    isArticle: true,
    cronSchedule: '30 3,9,15,21 * * *',
    cronJobName: 'signal-ingest-github-blog'
  },
  {
    id: 'cloudflare-blog',
    name: 'Cloudflare Blog',
    code: 'CF',
    shortName: 'Cloudflare Blog',
    description: 'Cloudflare 官方技术文章与产品动态',
    section: 'technology',
    itemLimit: 20,
    rsshubPath: '/cloudflare/blog',
    isArticle: true,
    cronSchedule: '30 4,10,16,22 * * *',
    cronJobName: 'signal-ingest-cloudflare-blog'
  },
  {
    id: 'geekpark',
    name: '极客公园',
    code: 'GP',
    shortName: '极客公园',
    description: '前沿科技商业与大模型特稿',
    section: 'technology',
    itemLimit: 30,
    feedUrl: 'http://www.geekpark.net/rss',
    isArticle: true,
    cronSchedule: '35 3,9,15,21 * * *',
    cronJobName: 'signal-ingest-geekpark'
  }
] as const

// Skills (2)
export const skillSources = [
  {
    id: 'skills-all-time',
    name: 'skills.sh 最热门',
    code: 'TOP',
    shortName: '最热门',
    description: '当前安装量领先的 Skills',
    section: 'skills',
    itemLimit: 100,
    rsshubPath: '/skills-sh/details/all-time?format=json',
    skillMetadata: true,
    isArticle: false,
    cronSchedule: '40 3,9,15,21 * * *',
    cronJobName: 'signal-ingest-skills-all-time'
  },
  {
    id: 'skills-trending',
    name: 'skills.sh 增长最快',
    code: 'UP',
    shortName: '增长最快',
    description: '过去 24 小时增长最快的 Skills',
    section: 'skills',
    itemLimit: 100,
    rsshubPath: '/skills-sh/details/trending?format=json',
    skillMetadata: true,
    isArticle: false,
    cronSchedule: '50 3,9,15,21 * * *',
    cronJobName: 'signal-ingest-skills-trending'
  }
] as const

// 国内新闻 News (6)
export const newsSources = [
  {
    id: 'xinhua',
    name: '新华社',
    code: 'XH',
    shortName: '新华社',
    description: '新华网新闻',
    section: 'news',
    itemLimit: 30,
    rsshubPath: '/news/xhsxw?limit=30',
    isArticle: true,
    cronSchedule: '0 1,7,13,19 * * *',
    cronJobName: 'signal-ingest-xinhua'
  },
  {
    id: 'cctv',
    name: '央视国内',
    code: 'TV',
    shortName: '央视',
    description: '央视国内新闻',
    section: 'news',
    itemLimit: 30,
    rsshubPath: '/cctv/china',
    isArticle: true,
    cronSchedule: '5 1,7,13,19 * * *',
    cronJobName: 'signal-ingest-cctv'
  },
  {
    id: 'chinanews',
    name: '中国新闻网',
    code: 'CN',
    shortName: '中新网',
    description: '中新网滚动新闻',
    section: 'news',
    itemLimit: 30,
    rsshubPath: '/chinanews?limit=30',
    isArticle: true,
    cronSchedule: '10 1,7,13,19 * * *',
    cronJobName: 'signal-ingest-chinanews'
  },
  {
    id: 'thepaper',
    name: '澎湃热榜',
    code: 'PP',
    shortName: '澎湃',
    description: '澎湃新闻热榜',
    section: 'news',
    itemLimit: 30,
    rsshubPath: '/thepaper/sidebar/hotNews',
    isArticle: true,
    cronSchedule: '15 1,7,13,19 * * *',
    cronJobName: 'signal-ingest-thepaper'
  },
  {
    id: 'jiemian',
    name: '界面中国',
    code: 'JM',
    shortName: '界面',
    description: '界面新闻中国频道',
    section: 'news',
    itemLimit: 30,
    rsshubPath: '/jiemian/lists/71',
    isArticle: true,
    cronSchedule: '20 1,7,13,19 * * *',
    cronJobName: 'signal-ingest-jiemian'
  },
  {
    id: 'baidu',
    name: '百度热搜',
    code: 'BD',
    shortName: '百度',
    description: '百度实时热搜',
    section: 'news',
    itemLimit: 30,
    rsshubPath: '/baidu/top/realtime',
    isArticle: true,
    cronSchedule: '25 1,7,13,19 * * *',
    cronJobName: 'signal-ingest-baidu'
  }
] as const

// AI 平台 (7)
export const aiSources = [
  {
    id: 'openai',
    name: 'OpenAI',
    code: 'OA',
    shortName: 'OpenAI',
    description: '综合新闻与官方文章',
    section: 'ai',
    itemLimit: 20,
    rsshubPath: '/openai/news?limit=20',
    isArticle: true,
    cronSchedule: '0 */2 * * *',
    cronJobName: 'signal-ingest-openai'
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    code: 'CG',
    shortName: 'ChatGPT',
    description: '产品更新日志',
    section: 'ai',
    itemLimit: 20,
    rsshubPath: '/openai/chatgpt/release-notes',
    isArticle: true,
    cronSchedule: '45 */2 * * *',
    cronJobName: 'signal-ingest-chatgpt'
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    code: 'AN',
    shortName: 'Anthropic',
    description: '官方文章与研究',
    section: 'ai',
    itemLimit: 20,
    rsshubPath: '/anthropic/news?limit=20',
    isArticle: true,
    cronSchedule: '5 */2 * * *',
    cronJobName: 'signal-ingest-anthropic'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    code: 'DS',
    shortName: 'DeepSeek',
    description: '官方公告',
    section: 'ai',
    itemLimit: 20,
    rsshubPath: '/deepseek/news',
    isArticle: true,
    cronSchedule: '10 */2 * * *',
    cronJobName: 'signal-ingest-deepseek'
  },
  {
    id: 'glm',
    name: '智谱 GLM',
    code: 'GL',
    shortName: 'GLM',
    description: '模型与平台更新',
    section: 'ai',
    itemLimit: 20,
    feedUrl: 'https://docs.bigmodel.cn/cn/update/new-releases/rss.xml',
    titleFromFirstStrong: true,
    urlFromFirstAnchor: true,
    isArticle: true,
    cronSchedule: '15 */2 * * *',
    cronJobName: 'signal-ingest-glm'
  },
  {
    id: 'google-ai',
    name: 'Google AI / Gemini',
    code: 'GM',
    shortName: 'Gemini',
    description: '官方文章',
    section: 'ai',
    itemLimit: 20,
    feedUrl: 'https://blog.google/innovation-and-ai/technology/ai/rss/',
    isArticle: true,
    cronSchedule: '20 */2 * * *',
    cronJobName: 'signal-ingest-google-ai'
  },
  {
    id: 'qwen',
    name: 'Qwen',
    code: 'QW',
    shortName: 'Qwen',
    description: '官方文章与研究',
    section: 'ai',
    itemLimit: 20,
    rsshubPath: '/qwen/blog/zh-CN',
    isArticle: true,
    cronSchedule: '25 */2 * * *',
    cronJobName: 'signal-ingest-qwen'
  },
  {
    id: 'lilian-weng',
    name: "Lil'Log",
    code: 'LW',
    shortName: "Lil'Log",
    description: '前 OpenAI 安全主管技术深度长文',
    section: 'ai',
    itemLimit: 20,
    feedUrl: 'https://lilianweng.github.io/index.xml',
    isArticle: true,
    cronSchedule: '45 3,9,15,21 * * *',
    cronJobName: 'signal-ingest-lilian-weng'
  },
  {
    id: 'simon-willison',
    name: 'Simon Willison',
    code: 'SW',
    shortName: 'Simon W',
    description: 'LLM 与 AI 开发者前沿专栏',
    section: 'ai',
    itemLimit: 20,
    feedUrl: 'https://simonwillison.net/atom/entries/',
    isArticle: true,
    cronSchedule: '55 3,9,15,21 * * *',
    cronJobName: 'signal-ingest-simon-willison'
  }
] as const

// 社交热点 Social (6)
export const socialSources = [
  {
    id: 'bilibili',
    name: '哔哩哔哩综合热门',
    code: 'BI',
    shortName: 'B 站',
    description: '全站热门视频',
    section: 'social',
    itemLimit: 30,
    rsshubPath: '/bilibili/popular/all',
    isArticle: true,
    cronSchedule: '30 1,7,13,19 * * *',
    cronJobName: 'signal-ingest-bilibili'
  },
  {
    id: 'zhihu',
    name: '知乎热榜',
    code: 'ZH',
    shortName: '知乎',
    description: '知乎热门问题',
    section: 'social',
    itemLimit: 30,
    rsshubPath: '/zhihu/hot',
    isArticle: true,
    cronSchedule: '35 1,7,13,19 * * *',
    cronJobName: 'signal-ingest-zhihu'
  },
  {
    id: 'coolapk',
    name: '酷安热榜',
    code: 'CK',
    shortName: '酷安',
    description: '数码与科技讨论',
    section: 'social',
    itemLimit: 30,
    rsshubPath: '/coolapk/hot',
    isArticle: true,
    cronSchedule: '40 1,7,13,19 * * *',
    cronJobName: 'signal-ingest-coolapk'
  },
  {
    id: 'hupu',
    name: '虎扑话题',
    code: 'HP',
    shortName: '虎扑',
    description: '热门社区话题',
    section: 'social',
    itemLimit: 30,
    rsshubPath: '/hupu/all/topic-daily',
    isArticle: true,
    cronSchedule: '45 1,7,13,19 * * *',
    cronJobName: 'signal-ingest-hupu'
  },
  {
    id: 'sspai',
    name: '少数派 Matrix',
    code: 'SP',
    shortName: '少数派',
    description: '数字生活社区文章',
    section: 'social',
    itemLimit: 30,
    rsshubPath: '/sspai/matrix',
    isArticle: true,
    cronSchedule: '50 1,7,13,19 * * *',
    cronJobName: 'signal-ingest-sspai'
  },
  {
    id: 'toutiao',
    name: '今日头条热榜',
    code: 'TT',
    shortName: '头条',
    description: '今日头条热门话题',
    section: 'social',
    itemLimit: 30,
    rsshubPath: '/toutiao/channel/news_hot',
    isArticle: true,
    cronSchedule: '55 1,7,13,19 * * *',
    cronJobName: 'signal-ingest-toutiao'
  }
] as const

// 财经 Finance (5)
export const financeSources = [
  {
    id: 'wallstreetcn',
    name: '华尔街见闻',
    code: 'WS',
    shortName: '见闻',
    description: '市场与商业热门文章',
    section: 'finance',
    itemLimit: 30,
    rsshubPath: '/wallstreetcn/hot/day',
    isArticle: true,
    cronSchedule: '30 2,8,14,20 * * *',
    cronJobName: 'signal-ingest-wallstreetcn'
  },
  {
    id: 'cls',
    name: '财联社',
    code: 'CL',
    shortName: '财联社',
    description: '热门财经新闻',
    section: 'finance',
    itemLimit: 30,
    rsshubPath: '/cls/hot?limit=20',
    isArticle: true,
    cronSchedule: '35 2,8,14,20 * * *',
    cronJobName: 'signal-ingest-cls'
  },
  {
    id: 'jin10',
    name: '金十数据',
    code: 'J10',
    shortName: '金十',
    description: '市场快讯',
    section: 'finance',
    itemLimit: 30,
    rsshubPath: '/jin10/topic/343',
    isArticle: true,
    cronSchedule: '40 2,8,14,20 * * *',
    cronJobName: 'signal-ingest-jin10'
  },
  {
    id: 'yicai',
    name: '第一财经',
    code: 'YC',
    shortName: '一财',
    description: '财经头条',
    section: 'finance',
    itemLimit: 30,
    rsshubPath: '/yicai/headline',
    isArticle: true,
    cronSchedule: '50 2,8,14,20 * * *',
    cronJobName: 'signal-ingest-yicai'
  },
  {
    id: 'stcn',
    name: '证券时报',
    code: 'ST',
    shortName: '证券时报',
    description: '证券市场要闻',
    section: 'finance',
    itemLimit: 30,
    rsshubPath: '/stcn/article/list/yw',
    isArticle: true,
    cronSchedule: '55 2,8,14,20 * * *',
    cronJobName: 'signal-ingest-stcn'
  }
] as const

// 游戏 Games (5)
export const gameSources = [
  {
    id: '3dmgame',
    name: '3DM 游戏网',
    code: '3D',
    shortName: '3DM',
    description: '游戏新闻与新品资讯',
    section: 'games',
    itemLimit: 30,
    rsshubPath: '/3dmgame/news/game',
    isArticle: true,
    cronSchedule: '0 3,9,15,21 * * *',
    cronJobName: 'signal-ingest-3dmgame'
  },
  {
    id: 'gcores',
    name: '机核',
    code: 'GC',
    shortName: '机核',
    description: '游戏文化与编辑文章',
    section: 'games',
    itemLimit: 30,
    rsshubPath: '/gcores/news?limit=20',
    isArticle: true,
    cronSchedule: '5 3,9,15,21 * * *',
    cronJobName: 'signal-ingest-gcores'
  },
  {
    id: 'gamersky',
    name: '游民星空',
    code: 'GS',
    shortName: '游民',
    description: '热门游戏新闻',
    section: 'games',
    itemLimit: 30,
    rsshubPath: '/gamersky/news',
    isArticle: true,
    cronSchedule: '10 3,9,15,21 * * *',
    cronJobName: 'signal-ingest-gamersky'
  },
  {
    id: 'ali213',
    name: '游侠网',
    code: 'A21',
    shortName: '游侠',
    description: '游戏资讯与行业动态',
    section: 'games',
    itemLimit: 30,
    rsshubPath: '/ali213/news/new',
    isArticle: true,
    cronSchedule: '15 3,9,15,21 * * *',
    cronJobName: 'signal-ingest-ali213'
  },
  {
    id: 'indienova',
    name: 'indienova',
    code: 'IN',
    shortName: 'indienova',
    description: '独立游戏与开发者文章',
    section: 'games',
    itemLimit: 30,
    rsshubPath: '/indienova/article',
    isArticle: true,
    cronSchedule: '20 3,9,15,21 * * *',
    cronJobName: 'signal-ingest-indienova'
  },
  {
    id: 'chuapp',
    name: '触乐网',
    code: 'CA',
    shortName: '触乐',
    description: '严肃游戏人文与产业深度特稿',
    section: 'games',
    itemLimit: 30,
    feedUrl: 'http://www.chuapp.com/feed',
    isArticle: true,
    cronSchedule: '25 3,9,15,21 * * *',
    cronJobName: 'signal-ingest-chuapp'
  }
] as const

export const signalSources = [
  ...technologySources,
  ...skillSources,
  ...newsSources,
  ...aiSources,
  ...socialSources,
  ...financeSources,
  ...gameSources
] as const

export type TechnologySource = (typeof technologySources)[number]
export type TechnologySourceId = TechnologySource['id']
export type SkillSource = (typeof skillSources)[number]
export type SkillSourceId = SkillSource['id']
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

export const technologyArticleSources = technologySources.filter((s) => s.isArticle)

// Maps for O(1) lookups
const sourcesById = new Map<string, SignalSource>(signalSources.map((s) => [s.id, s]))
const sectionsById = new Map<string, SignalSectionConfig>(signalSections.map((s) => [s.id, s]))

const cronSourceOrder: readonly SignalSourceId[] = [
  'openai',
  'anthropic',
  'deepseek',
  'glm',
  'google-ai',
  'qwen',
  'chatgpt',
  'github',
  'hacker-news',
  'juejin',
  'ithome',
  '36kr',
  'xinhua',
  'cctv',
  'chinanews',
  'thepaper',
  'jiemian',
  'baidu',
  'bilibili',
  'zhihu',
  'coolapk',
  'hupu',
  'sspai',
  'toutiao',
  'wallstreetcn',
  'cls',
  'jin10',
  'yicai',
  'stcn',
  '3dmgame',
  'gcores',
  'gamersky',
  'ali213',
  'indienova',
  'github-blog',
  'skills-all-time',
  'skills-trending',
  'geekpark',
  'chuapp',
  'lilian-weng',
  'simon-willison',
  'cloudflare-blog'
] as const

// Cron jobs
export const SIGNAL_CRON_JOBS = cronSourceOrder.map((id) => {
  const source = sourcesById.get(id)
  if (!source) throw new Error(`Missing cron source: ${id}`)
  return {
    source: source.id,
    name: source.cronJobName,
    schedule: source.cronSchedule
  }
})

// Query interfaces
export function isSignalSourceId(id: string): id is SignalSourceId {
  return sourcesById.has(id)
}

export function isSignalSectionId(id: string): id is SignalSectionId {
  return sectionsById.has(id)
}

export function isTechnologySourceId(id: string): id is TechnologySourceId {
  return sourcesById.get(id)?.section === 'technology'
}

export function isSkillSourceId(id: string): id is SkillSourceId {
  return sourcesById.get(id)?.section === 'skills'
}

export function isNewsSourceId(id: string): id is NewsSourceId {
  return sourcesById.get(id)?.section === 'news'
}

export function isAiSourceId(id: string): id is AiSourceId {
  return sourcesById.get(id)?.section === 'ai'
}

export function isSocialSourceId(id: string): id is SocialSourceId {
  return sourcesById.get(id)?.section === 'social'
}

export function isFinanceSourceId(id: string): id is FinanceSourceId {
  return sourcesById.get(id)?.section === 'finance'
}

export function isGameSourceId(id: string): id is GameSourceId {
  return sourcesById.get(id)?.section === 'games'
}

export function getTechnologySource(id: TechnologySourceId): TechnologySource {
  const source = sourcesById.get(id)
  if (source?.section !== 'technology') throw new Error(`Unknown technology source: ${id}`)
  return source as TechnologySource
}

export function getSkillSource(id: SkillSourceId): SkillSource {
  const source = sourcesById.get(id)
  if (source?.section !== 'skills') throw new Error(`Unknown skill source: ${id}`)
  return source as SkillSource
}

export function getNewsSource(id: NewsSourceId): NewsSource {
  const source = sourcesById.get(id)
  if (source?.section !== 'news') throw new Error(`Unknown news source: ${id}`)
  return source as NewsSource
}

export function getAiSource(id: AiSourceId): AiSource {
  const source = sourcesById.get(id)
  if (source?.section !== 'ai') throw new Error(`Unknown AI source: ${id}`)
  return source as AiSource
}

export function getSocialSource(id: SocialSourceId): SocialSource {
  const source = sourcesById.get(id)
  if (source?.section !== 'social') throw new Error(`Unknown social source: ${id}`)
  return source as SocialSource
}

export function getFinanceSource(id: FinanceSourceId): FinanceSource {
  const source = sourcesById.get(id)
  if (source?.section !== 'finance') throw new Error(`Unknown finance source: ${id}`)
  return source as FinanceSource
}

export function getGameSource(id: GameSourceId): GameSource {
  const source = sourcesById.get(id)
  if (source?.section !== 'games') throw new Error(`Unknown game source: ${id}`)
  return source as GameSource
}

export function getSignalSource(id: string): SignalSource {
  const source = sourcesById.get(id)
  if (!source) throw new Error(`Unknown signal source: ${id}`)
  return source
}

export function findSignalSource(id: string): SignalSource | undefined {
  return sourcesById.get(id)
}

export function getSignalSection(id: string): SignalSectionConfig {
  const section = sectionsById.get(id)
  if (!section) throw new Error(`Unknown signal section: ${id}`)
  return section
}

export function findSignalSection(id: string): SignalSectionConfig | undefined {
  return sectionsById.get(id)
}

export function listSignalSections(): readonly SignalSectionConfig[] {
  return signalSections
}

export function listSignalSources(filter?: {
  section?: SignalSectionId
  isArticle?: boolean
}): readonly SignalSource[] {
  if (!filter) return signalSources
  return signalSources.filter((s) => {
    if (filter.section && s.section !== filter.section) return false
    if (filter.isArticle !== undefined && s.isArticle !== filter.isArticle) return false
    return true
  })
}

export function listSignalCronJobs(): ReadonlyArray<{
  source: SignalSourceId
  name: string
  schedule: string
}> {
  return SIGNAL_CRON_JOBS
}

export function resolveSignalFeedUrl(source: SignalSource, rsshubBaseUrl: string): string {
  return 'feedUrl' in source && typeof source.feedUrl === 'string'
    ? source.feedUrl
    : `${rsshubBaseUrl}${'rsshubPath' in source ? source.rsshubPath : ''}`
}
