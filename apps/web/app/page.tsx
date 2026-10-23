import {
  ArrowRight,
  Bookmark,
  Cpu,
  Gamepad2,
  Globe,
  Laptop,
  Link as LinkIcon,
  LockKeyhole,
  Newspaper,
  ShieldCheck,
  TrendingUp
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { actionStyles } from '../components/action-styles'
import { SourceIcon } from '../components/source-icon'
import { ThemeToggle } from '../components/theme-toggle'
import {
  createHomepageStructuredData,
  createPageMetadata,
  HOMEPAGE_FAQ_ITEMS,
  HOMEPAGE_MODIFIED_AT,
  HOMEPAGE_PUBLISHED_AT,
  SITE_AUTHOR_NAME,
  SITE_AUTHOR_URL,
  SITE_DESCRIPTION,
  SITE_REPOSITORY_URL,
  serializeStructuredData
} from '../lib/seo'
import { optionalCanonical } from '../lib/site-url'
import {
  aiSources,
  financeSources,
  gameSources,
  getSignalSource,
  newsSources,
  skillSources,
  socialSources,
  technologySources
} from '../lib/technology-sources'
import './home.css'

export const dynamic = 'force-static'
export const metadata = {
  ...createPageMetadata({
    title: '今日热点 - AI、科技、新闻、财经与游戏热榜',
    description: SITE_DESCRIPTION,
    path: '/',
    publishedTime: HOMEPAGE_PUBLISHED_AT,
    modifiedTime: HOMEPAGE_MODIFIED_AT
  }),
  title: { absolute: '今日热点 - AI、科技、新闻、财经与游戏热榜' },
  other: {
    'article:published_time': HOMEPAGE_PUBLISHED_AT,
    'article:modified_time': HOMEPAGE_MODIFIED_AT
  }
}

const coverage = [
  {
    name: 'AI',
    href: '/ai',
    sources: aiSources,
    tone: 'ai',
    cadence: '每 2 小时',
    limit: '20 条 / 源',
    feed: '/feeds/ai.xml',
    sample: 'OpenAI / ChatGPT / Anthropic / DeepSeek / GLM / Gemini / Qwen'
  },
  {
    name: '科技',
    href: '/technology',
    sources: technologySources,
    tone: 'technology',
    cadence: '每 6 小时',
    limit: '20–30 条 / 源',
    feed: '/feeds/technology.xml',
    sample: 'GitHub Trending / Hacker News / Cloudflare Blog / 掘金 / IT之家 / 36氪'
  },
  {
    name: '新闻',
    href: '/news',
    sources: newsSources,
    tone: 'news',
    cadence: '每 6 小时',
    limit: '30 条 / 源',
    feed: '/feeds/news.xml',
    sample: '新华社 / 央视国内 / 中国新闻网 / 澎湃热榜 / 界面中国 / 百度热搜'
  },
  {
    name: '社交',
    href: '/social',
    sources: socialSources,
    tone: 'social',
    cadence: '每 6 小时',
    limit: '30 条 / 源',
    feed: '/feeds/social.xml',
    sample: '哔哩哔哩 / 知乎热榜 / 酷安 / 虎扑 / 少数派 Matrix / 今日头条'
  },
  {
    name: '财经',
    href: '/finance',
    sources: financeSources,
    tone: 'finance',
    cadence: '每 6 小时',
    limit: '20–30 条 / 源',
    feed: '/feeds/finance.xml',
    sample: '华尔街见闻 / 财联社 / 金十数据 / 第一财经 / 证券时报'
  },
  {
    name: '游戏',
    href: '/games',
    sources: gameSources,
    tone: 'games',
    cadence: '每 6 小时',
    limit: '20–30 条 / 源',
    feed: '/feeds/games.xml',
    sample: '机核 / 触乐网 / indienova / 3DM 游戏网 / 游民星空 / 游侠网'
  }
] as const

const aiPreview = [
  ['openai', '/ai/openai', '模型能力、产品发布与行业动态'],
  ['anthropic', '/ai/anthropic', '模型研究与产品进展'],
  ['deepseek', '/ai/deepseek', '大模型与开源生态动态'],
  ['google-ai', '/ai/google-ai', '模型、工具与开发者生态']
] as const

const communityPreview = [
  ['thepaper', '/news/thepaper', '时事新闻与社会话题'],
  ['zhihu', '/social/zhihu', '热门话题与问答讨论'],
  ['bilibili', '/social/bilibili', '科技、游戏与多领域社区讨论']
] as const

function SourceList({ entries }: { entries: typeof aiPreview | typeof communityPreview }) {
  return (
    <ul className="home-source-list">
      {entries.map(([id, href, description]) => (
        <li key={id}>
          <Link href={href} className="home-source-link">
            <SourceIcon source={getSignalSource(id)} className="size-10 [&>svg]:size-6" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                {getSignalSource(id).name}
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                {description}
              </span>
            </span>
            <ArrowRight
              aria-hidden="true"
              className="ml-auto size-4 shrink-0 text-muted-foreground"
            />
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default function HomePage() {
  const canonical = optionalCanonical('/')
  const maximum = Math.max(...coverage.map(({ sources }) => sources.length))
  const readingSourceCount = coverage.reduce((sum, item) => sum + item.sources.length, 0)
  const totalSourceCount = readingSourceCount + skillSources.length

  return (
    <div className="home-page">
      <a href="#home-main" className="home-skip">
        跳到主要内容
      </a>
      <header className="home-header">
        <div className="home-width flex min-h-17 items-center gap-6">
          <Link
            href="/"
            aria-label="今日热点首页"
            className="headline-display flex shrink-0 items-center gap-2.5 text-2xl"
          >
            <Image src="/icon.svg" alt="" width={32} height={32} unoptimized />
            今日热点
          </Link>
          <nav aria-label="首页导航" className="home-nav">
            <a href="#topics">热点分区</a>
            <a href="#specs">收录规格</a>
            <a href="#faq">常见问题</a>
            <Link href="/about">关于本站</Link>
            <Link href="/about#contact">联系我们</Link>
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-5">
            <ThemeToggle />
            <Link href="/latest" className={actionStyles('primary')}>
              开始阅读
            </Link>
          </div>
        </div>
      </header>

      <main id="home-main">
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-width relative">
            <h1 id="home-title" className="headline-display">
              今天的热点，在这里看<span className="text-primary">。</span>
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-pretty text-base leading-8 text-muted-foreground sm:text-lg">
              今日热点（AI 热榜）汇集 {coverage.length} 个阅读分区、 {readingSourceCount}{' '}
              路公开资讯源与 {skillSources.length} 个 AI Agent Skills 榜单，共覆盖{' '}
              {totalSourceCount} 路固定订阅。从 OpenAI 、 Anthropic 、 DeepSeek 到 GitHub Trending
              、澎湃新闻与知乎热榜，按发布时间查看今天值得关注的事。
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3 sm:gap-4">
              <Link
                href="/latest"
                className={actionStyles('primary', 'large', 'min-h-12 px-8 text-base')}
              >
                开始阅读 <ArrowRight aria-hidden="true" className="size-5" />
              </Link>
              <a
                href="#topics"
                className={actionStyles('outline', 'large', 'min-h-12 px-6 text-base')}
              >
                看看有哪些热点
              </a>
            </div>
          </div>
        </section>

        <section id="topics" aria-labelledby="topics-title" className="home-width home-topics">
          <h2 id="topics-title" className="headline-display text-3xl sm:text-4xl">
            各个平台，都在关注什么？
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-7 text-muted-foreground">
            热点浏览示意 · 平台按 AI 模型、开发者技术社区与综合资讯划分 {coverage.length}{' '}
            个内容分区。你可以直接进入 /latest 查看全站最近更新，也可以按 /ai 、 /technology 、
            /news 、 /social 、 /finance 、 /games 或具体来源筛选已收录的文章。
          </p>
          <div id="sources" className="home-panels">
            <section className="home-panel" aria-labelledby="ai-title">
              <div className="home-panel-heading">
                <span className="home-topic-icon home-tone-ai">
                  <Cpu aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 id="ai-title" className="text-lg font-semibold">
                    AI 模型与产品动态有哪些来源？
                  </h3>
                  <p>
                    收录 OpenAI 、 ChatGPT 、 Anthropic 、 DeepSeek 、智谱 GLM 、 Google AI 、
                    Antigravity 、 Qwen 、 Lil&apos;Log 与 Simon Willison 共 {aiSources.length}{' '}
                    路官方来源，核心模型动态每 2 小时检查 1 次更新，并提供 /ai/events 事件时间轴。
                  </p>
                </div>
              </div>
              <SourceList entries={aiPreview} />
              <Link href="/ai" className="home-panel-action">
                进入 AI 分区 <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </section>

            <section className="home-panel" aria-labelledby="technology-title">
              <div className="home-panel-heading">
                <span className="home-topic-icon home-tone-technology">
                  <Laptop aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 id="technology-title" className="text-lg font-semibold">
                    科技与开发者社区关注哪些项目？
                  </h3>
                  <p>
                    聚合 GitHub Trending 中文开源榜、 Hacker News 、 GitHub Blog 、 Cloudflare Blog
                    、掘金、 IT之家、 36氪 与极客公园共 {technologySources.length} 路技术来源，每 6
                    小时同步开源仓库、工程实践与产业报道。
                  </p>
                </div>
              </div>
              <Link href="/github" className="home-source-link home-github">
                <SourceIcon source={getSignalSource('github')} className="size-10 [&>svg]:size-6" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">GitHub</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    开源项目与开发工具排行
                  </span>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="ml-auto size-4 shrink-0 text-muted-foreground"
                />
              </Link>
              <figure className="home-coverage">
                <figcaption className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="font-semibold">不同兴趣，都有来源</span>
                  <span className="text-muted-foreground">已配置来源数</span>
                </figcaption>
                <ul className="home-chart" aria-label="各分区已配置的来源数量">
                  {coverage.map(({ name, href, sources, tone }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className={`home-chart-column home-tone-${tone}`}
                        aria-label={`${name}，${sources.length} 个来源，进入分区`}
                      >
                        <span className="home-chart-number">{sources.length}</span>
                        <span className="home-chart-track" aria-hidden="true">
                          <span style={{ height: `${(sources.length / maximum) * 100}%` }} />
                        </span>
                        <span className="home-chart-label">{name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  来源覆盖示意，不代表实时热度或文章数量。
                </p>
              </figure>
              <Link href="/technology" className="home-panel-action">
                进入科技分区 <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </section>

            <section className="home-panel" aria-labelledby="community-title">
              <div className="home-panel-heading">
                <span className="home-topic-icon home-tone-news">
                  <Newspaper aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 id="community-title" className="text-lg font-semibold">
                    新闻、社交、财经与游戏有哪些看点？
                  </h3>
                  <p>
                    汇总新华社、央视、澎湃热榜等 {newsSources.length} 路国内新闻，知乎、哔哩哔哩、
                    少数派等 {socialSources.length}{' '}
                    路社区热榜，以及华尔街见闻、财联社、机核、触乐网等{' '}
                    {financeSources.length + gameSources.length} 路财经与游戏来源，每 6 小时同步。
                  </p>
                </div>
              </div>
              <SourceList entries={communityPreview} />
              <div className="home-other-topics">
                <Link href="/finance" className="home-tone-finance">
                  <TrendingUp aria-hidden="true" className="size-4" />
                  财经
                </Link>
                <Link href="/games" className="home-tone-games">
                  <Gamepad2 aria-hidden="true" className="size-4" />
                  游戏
                </Link>
              </div>
              <Link href="/latest" className="home-panel-action">
                查看全部热点 <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </section>
          </div>
        </section>

        <section className="home-trust" aria-labelledby="trust-title">
          <div className="home-width home-trust-grid">
            <div className="flex items-start gap-5">
              <ShieldCheck aria-hidden="true" className="mt-1 size-12 shrink-0 text-primary" />
              <div>
                <h2 id="trust-title" className="headline-display text-2xl">
                  内容从哪里来，怎么核对原文出处？
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
                  站内全部条目均来自公开的官方 RSS 2.0 、 Atom 1.0 订阅源与 RSSHub 路由， 100%
                  保留原始平台名称、发布时间与原文 URL
                  。聚合列表不改写事实，方便你随时跳转原站核对上下文。
                </p>
              </div>
            </div>
            <div className="home-trust-detail">
              <LinkIcon aria-hidden="true" />
              <div>
                <strong className="home-trust-heading">保留原文链接</strong>
                <p>
                  每篇文章均附带源站直达地址，离站前显示目标域名提示，确认后在新标签页打开原始网页。
                </p>
              </div>
            </div>
            <div className="home-trust-detail">
              <Globe aria-hidden="true" />
              <div>
                <strong className="home-trust-heading">覆盖 {totalSourceCount} 路公开信源</strong>
                <p>
                  横跨 AI 、科技、国内新闻、社交、财经、游戏 {coverage.length} 个阅读分区与{' '}
                  {skillSources.length} 个 Skills 榜单。
                </p>
              </div>
            </div>
            <div className="home-trust-detail">
              <LockKeyhole aria-hidden="true" />
              <div>
                <strong className="home-trust-heading">阅读偏好留在本地</strong>
                <p>
                  免注册即可阅读；关注列表、书签与最近 100 条浏览足迹保存在当前浏览器 localStorage
                  。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="home-width home-reading" aria-labelledby="reading-title">
          <div>
            <h2 id="reading-title" className="headline-display text-2xl">
              怎么按兴趣筛选，把好文章留着慢慢读？
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              无需注册账号即可使用全站阅读工具。你可以在 /following 勾选常看的信源组合，将文章收入
              /reading-list 稍后读；英文长文支持切换原文、双语段落对照与中文译文（缓存 7 天），满
              200 个字符的文章可按需生成要点总结（缓存 30 天）。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/following" className={actionStyles('outline')}>
              选择关注来源 <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link href="/reading-list" className={actionStyles('ghost')}>
              <Bookmark aria-hidden="true" className="size-4" />
              稍后读与足迹
            </Link>
          </div>
        </section>

        <section id="specs" className="home-width home-specs" aria-labelledby="specs-title">
          <div className="home-specs-header">
            <h2 id="specs-title" className="headline-display text-2xl sm:text-3xl">
              各分区的收录规模与更新频率是多少？
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">
              全站当前配置 {coverage.length} 个文章与热榜分区（共 {readingSourceCount} 路来源）以及{' '}
              {skillSources.length} 个 AI Agent Skills 排行榜（共 {totalSourceCount}{' '}
              路定时任务）。各分区按固定周期错峰拉取，每次采集会校验内容快照并在有更新时刷新缓存与{' '}
              IndexNow 索引，具体规格如下表所示：
            </p>
          </div>

          <div className="home-table-wrap">
            <table className="home-spec-table">
              <caption className="sr-only">
                今日热点各分区的已配置来源数量、采集周期、单源保留条数与 RSS 订阅地址
              </caption>
              <thead>
                <tr>
                  <th scope="col">分区名称</th>
                  <th scope="col">已配置来源数</th>
                  <th scope="col">同步周期</th>
                  <th scope="col">单源保留上限</th>
                  <th scope="col">代表信源与订阅入口</th>
                </tr>
              </thead>
              <tbody>
                {coverage.map((item) => (
                  <tr key={item.href}>
                    <th scope="row">
                      <Link href={item.href} className="home-table-link">
                        {item.name}
                      </Link>
                    </th>
                    <td>{item.sources.length} 路</td>
                    <td>{item.cadence}</td>
                    <td>{item.limit}</td>
                    <td>
                      <span>{item.sample}</span> ·{' '}
                      <a href={item.feed} className="home-table-feed">
                        {item.feed}
                      </a>
                    </td>
                  </tr>
                ))}
                <tr>
                  <th scope="row">
                    <Link href="/skills" className="home-table-link">
                      热门 Skills
                    </Link>
                  </th>
                  <td>{skillSources.length} 路</td>
                  <td>每 6 小时</td>
                  <td>100 条 / 榜</td>
                  <td>
                    <span>skills.sh 最热门 (all-time) / 增长最快 (trending 24h)</span> ·{' '}
                    <Link href="/skills" className="home-table-feed">
                      /skills
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="home-citations">
            <blockquote
              cite="https://www.rssboard.org/rss-specification"
              className="home-citation-card"
            >
              <p>
                「RSS 2.0 与 Atom 1.0 订阅规范要求每个条目提供稳定的标题、永久链接（link /
                id）与发布时间戳（pubDate / published），确保聚合器能够原样追溯上游出处。」
              </p>
              <footer>
                引用自{' '}
                <cite>
                  <a
                    href="https://www.rssboard.org/rss-specification"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    RSS 2.0 Specification (RSS Advisory Board)
                  </a>
                </cite>{' '}
                与{' '}
                <cite>
                  <a
                    href="https://www.rfc-editor.org/rfc/rfc4287"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    IETF RFC 4287 (Atom Syndication Format)
                  </a>
                </cite>
              </footer>
            </blockquote>

            <blockquote
              cite="https://modelcontextprotocol.io/specification"
              className="home-citation-card"
            >
              <p>
                「Model Context Protocol (MCP) 与 llms.txt 为 AI
                助手和检索系统提供标准化的工具调用与站点目录说明，减少网页噪声并保留明确的信源归属。」
              </p>
              <footer>
                引用自{' '}
                <cite>
                  <a
                    href="https://modelcontextprotocol.io/specification"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Model Context Protocol Specification
                  </a>
                </cite>{' '}
                与{' '}
                <cite>
                  <a href="https://llmstxt.org/" target="_blank" rel="noopener noreferrer">
                    llms.txt Standard
                  </a>
                </cite>{' '}
                · 本站接口： <Link href="/mcp">/mcp</Link> 、 <a href="/llms.txt">/llms.txt</a> 、{' '}
                <a href="/llms-full.txt">/llms-full.txt</a>
              </footer>
            </blockquote>
          </div>
        </section>

        <section id="faq" className="home-width home-faq" aria-labelledby="faq-title">
          <h2 id="faq-title" className="headline-display text-2xl sm:text-3xl">
            常见问题：今日热点怎么用？
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            以下整理了关于信源覆盖、更新频率、 RSS 2.0 / MCP 接口以及本地隐私存储的 4 个核心问题：
          </p>
          <div className="home-faq-grid">
            {HOMEPAGE_FAQ_ITEMS.map((item) => (
              <article key={item.question} className="home-faq-item">
                <h3 className="text-base font-semibold text-foreground">{item.question}</h3>
                <p className="mt-2.5 text-sm leading-7 text-muted-foreground">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="home-width home-footer">
        <div className="home-footer-meta">
          <p>
            习惯用 RSS 阅读器？
            <Link href="/about#rss">
              查看订阅方式 <ArrowRight aria-hidden="true" className="inline size-3.5" />
            </Link>
          </p>
          <p className="home-byline">
            维护者：
            <a href={SITE_AUTHOR_URL} rel="author">
              {SITE_AUTHOR_NAME}
            </a>{' '}
            · 开源仓库：
            <a href={SITE_REPOSITORY_URL} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>{' '}
            · 上线日期：<time dateTime="2026-09-01">2026-09-01</time> · 最近更新：
            <time dateTime="2026-10-23">2026-10-23</time>
          </p>
        </div>
        <nav aria-label="站点信息">
          <Link href="/about">关于本站</Link>
          <Link href="/about#contact">联系我们</Link>
          <Link href="/privacy">隐私说明</Link>
          <Link href="/privacy#terms">服务条款</Link>
          <Link href="/mcp">MCP 服务</Link>
          <a href="/llms.txt">llms.txt</a>
        </nav>
      </footer>
      {canonical && (
        <script type="application/ld+json">
          {serializeStructuredData(createHomepageStructuredData(canonical))}
        </script>
      )}
    </div>
  )
}
