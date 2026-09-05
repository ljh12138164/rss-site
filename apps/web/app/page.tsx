import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { SiteShell } from '../components/site-shell'
import { SourceBand } from '../components/source-band'
import {
  type AiFeeds,
  type FinanceFeeds,
  type GameFeeds,
  getAiFeeds,
  getFinanceFeeds,
  getGameFeeds,
  getNewsFeeds,
  getSocialFeeds,
  getTechnologyFeeds,
  type NewsFeeds,
  type SocialFeeds,
  type TechnologyFeeds
} from '../lib/hot-feed'
import {
  aiSources,
  financeSources,
  gameSources,
  newsSources,
  socialSources,
  technologySources
} from '../lib/technology-sources'

export const dynamic = 'force-dynamic'

export function HomeView({
  aiFeeds,
  technologyFeeds,
  newsFeeds,
  socialFeeds,
  financeFeeds,
  gameFeeds
}: {
  aiFeeds: AiFeeds
  technologyFeeds: TechnologyFeeds
  newsFeeds: NewsFeeds
  socialFeeds: SocialFeeds
  financeFeeds: FinanceFeeds
  gameFeeds: GameFeeds
}) {
  return (
    <SiteShell>
      <header className="pb-16 sm:pb-20">
        <h1 className="max-w-2xl text-4xl font-semibold leading-[1.12] tracking-[-0.05em] sm:text-6xl">
          今天的 AI 与互联网热点
        </h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
          优先收录 AI 平台官方文章，也汇集科技、国内新闻、社交、财经和游戏榜单。
        </p>
      </header>

      <section aria-labelledby="ai-heading" id="ai">
        <SectionHeading href="/ai" title="AI" titleId="ai-heading" />
        <div className="grid gap-x-10 gap-y-12 md:grid-cols-2">
          {aiSources.map((source) => (
            <SourceBand basePath="/ai" feed={aiFeeds[source.id]} key={source.id} source={source} />
          ))}
        </div>
      </section>

      <section aria-labelledby="technology-heading" className="mt-24 sm:mt-32" id="technology">
        <SectionHeading href="/technology" title="科技" titleId="technology-heading" />
        <div className="grid gap-x-10 gap-y-12 md:grid-cols-2">
          {technologySources.map((source) => (
            <SourceBand feed={technologyFeeds[source.id]} key={source.id} source={source} />
          ))}
        </div>
      </section>

      <section aria-labelledby="news-heading" className="mt-24 sm:mt-32" id="news">
        <SectionHeading href="/news" title="国内新闻" titleId="news-heading" />
        <div className="grid gap-x-10 gap-y-12 md:grid-cols-2">
          {newsSources.map((source) => (
            <SourceBand
              basePath="/news"
              feed={newsFeeds[source.id]}
              key={source.id}
              source={source}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="social-heading" className="mt-24 sm:mt-32" id="social">
        <SectionHeading href="/social" title="社交热点" titleId="social-heading" />
        <div className="grid gap-x-10 gap-y-12 md:grid-cols-2">
          {socialSources.map((source) => (
            <SourceBand
              basePath="/social"
              feed={socialFeeds[source.id]}
              key={source.id}
              source={source}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="finance-heading" className="mt-24 sm:mt-32" id="finance">
        <SectionHeading href="/finance" title="财经" titleId="finance-heading" />
        <div className="grid gap-x-10 gap-y-12 md:grid-cols-2">
          {financeSources.map((source) => (
            <SourceBand
              basePath="/finance"
              feed={financeFeeds[source.id]}
              key={source.id}
              source={source}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="games-heading" className="mt-24 sm:mt-32" id="games">
        <SectionHeading href="/games" title="游戏" titleId="games-heading" />
        <div className="grid gap-x-10 gap-y-12 md:grid-cols-2">
          {gameSources.map((source) => (
            <SourceBand
              basePath="/games"
              feed={gameFeeds[source.id]}
              key={source.id}
              source={source}
            />
          ))}
        </div>
      </section>
    </SiteShell>
  )
}

function SectionHeading({
  href,
  title,
  titleId
}: {
  href: string
  title: string
  titleId: string
}) {
  return (
    <div className="mb-8 flex items-center justify-between gap-6 border-b border-border pb-4">
      <h2 className="text-2xl font-semibold tracking-[-0.03em]" id={titleId}>
        {title}
      </h2>
      <Link
        className="group flex min-h-11 shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
        href={href}
      >
        查看总览
        <ArrowRight
          aria-hidden="true"
          className="size-3.5 transition-transform group-hover:translate-x-0.5"
        />
      </Link>
    </div>
  )
}

export default async function HomePage() {
  const [aiFeeds, technologyFeeds, newsFeeds, socialFeeds, financeFeeds, gameFeeds] =
    await Promise.all([
      getAiFeeds(1),
      getTechnologyFeeds(1),
      getNewsFeeds(1),
      getSocialFeeds(1),
      getFinanceFeeds(1),
      getGameFeeds(1)
    ])
  return (
    <HomeView
      aiFeeds={aiFeeds}
      financeFeeds={financeFeeds}
      gameFeeds={gameFeeds}
      newsFeeds={newsFeeds}
      socialFeeds={socialFeeds}
      technologyFeeds={technologyFeeds}
    />
  )
}
