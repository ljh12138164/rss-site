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
  SITE_DESCRIPTION,
  serializeStructuredData
} from '../lib/seo'
import { optionalCanonical } from '../lib/site-url'
import {
  aiSources,
  financeSources,
  gameSources,
  getSignalSource,
  newsSources,
  socialSources,
  technologySources
} from '../lib/technology-sources'
import './home.css'

export const dynamic = 'force-static'
export const metadata = {
  ...createPageMetadata({
    title: '今日热点 - AI、科技、新闻、财经与游戏热榜',
    description: SITE_DESCRIPTION,
    path: '/'
  }),
  title: { absolute: '今日热点 - AI、科技、新闻、财经与游戏热榜' }
}

const coverage = [
  { name: 'AI', href: '/ai', sources: aiSources, tone: 'ai' },
  { name: '科技', href: '/technology', sources: technologySources, tone: 'technology' },
  { name: '新闻', href: '/news', sources: newsSources, tone: 'news' },
  { name: '社交', href: '/social', sources: socialSources, tone: 'social' },
  { name: '财经', href: '/finance', sources: financeSources, tone: 'finance' },
  { name: '游戏', href: '/games', sources: gameSources, tone: 'games' }
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
            <a href="#sources">内容来源</a>
            <Link href="/about">关于本站</Link>
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
              汇集多个平台的热门话题和最新动态。从 AI、科技到新闻、社交、财经和游戏，
              看看今天有哪些值得关注的事。
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
          <p className="mt-2 text-sm text-muted-foreground">
            热点浏览示意 · 选择分区或来源，查看已收录的内容
          </p>
          <div id="sources" className="home-panels">
            <section className="home-panel" aria-labelledby="ai-title">
              <div className="home-panel-heading">
                <span className="home-topic-icon home-tone-ai">
                  <Cpu aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 id="ai-title" className="text-lg font-semibold">
                    AI 模型与产品动态
                  </h3>
                  <p>模型发布、研究进展与产品更新，看看不同平台的新动态。</p>
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
                    科技与开发者社区
                  </h3>
                  <p>从开源项目到科技媒体，发现技术社区正在关注的事。</p>
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
                    新闻与社会话题
                  </h3>
                  <p>新闻报道、社区问答与热门视频，从不同来源了解话题。</p>
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
                  保留来源，方便继续了解
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
                  内容保留来源和原文链接，方便继续阅读、核对信息。公开来源的内容，也值得多方比较。
                </p>
              </div>
            </div>
            <div className="home-trust-detail">
              <LinkIcon aria-hidden="true" />
              <div>
                <h3>保留原文链接</h3>
                <p>找到感兴趣的内容，继续读原文。</p>
              </div>
            </div>
            <div className="home-trust-detail">
              <Globe aria-hidden="true" />
              <div>
                <h3>覆盖多个平台</h3>
                <p>从 AI、科技到新闻、社交、财经和游戏。</p>
              </div>
            </div>
            <div className="home-trust-detail">
              <LockKeyhole aria-hidden="true" />
              <div>
                <h3>阅读偏好留在本地</h3>
                <p>关注、隐藏和阅读偏好保存在当前浏览器。</p>
              </div>
            </div>
          </div>
        </section>

        <section className="home-width home-reading" aria-labelledby="reading-title">
          <div>
            <h2 id="reading-title" className="headline-display text-2xl">
              找到想看的，也方便接着读。
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              不用注册，也能浏览热点和阅读文章。关注感兴趣的来源，把文章加入稍后读；支持翻译的文章，可以切换中文译文。
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
      </main>

      <footer className="home-width home-footer">
        <p>
          习惯用 RSS 阅读器？
          <Link href="/about#rss">
            查看订阅方式 <ArrowRight aria-hidden="true" className="inline size-3.5" />
          </Link>
        </p>
        <nav aria-label="站点信息">
          <Link href="/about">关于本站</Link>
          <Link href="/privacy">隐私说明</Link>
          <Link href="/mcp">MCP 服务</Link>
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
