import { ArrowRight, RadioTower } from 'lucide-react'
import Link from 'next/link'
import { SiteShell } from '../components/site-shell'
import { SourceBand } from '../components/source-band'
import { SourceFrequencyStrip } from '../components/source-frequency-strip'
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
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-primary">
          <RadioTower aria-hidden="true" className="size-3.5" />
          Signal archive
        </p>
        <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.12] tracking-[-0.05em] sm:text-6xl">
          从三十六路信号里，
          <br />
          看清今天正在发生什么。
        </h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
          以 AI
          平台官方发布为主，科技、国内新闻、社交、财经与游戏热点作为辅助。每个来源保持自己的顺序，不把
          不同平台硬凑成一个排行榜。
        </p>
      </header>

      <section aria-labelledby="ai-heading" id="ai">
        <SectionHeading href="/ai" index="01 / AI 平台" title="官方发布" titleId="ai-heading" />
        <div className="mb-10">
          <SourceFrequencyStrip ariaLabel="AI 平台来源频段" basePath="/ai" sources={aiSources} />
        </div>
        <div className="grid gap-x-10 gap-y-12 md:grid-cols-2">
          {aiSources.map((source) => (
            <SourceBand
              basePath="/ai"
              feed={aiFeeds[source.id]}
              key={source.id}
              refreshHours={2}
              source={source}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="technology-heading" className="mt-24 sm:mt-32" id="technology">
        <SectionHeading
          href="/technology"
          index="02 / 科技"
          title="当前信号"
          titleId="technology-heading"
        />
        <div className="mb-10">
          <SourceFrequencyStrip />
        </div>
        <div className="grid gap-x-10 gap-y-12 md:grid-cols-2">
          {technologySources.map((source) => (
            <SourceBand feed={technologyFeeds[source.id]} key={source.id} source={source} />
          ))}
        </div>
      </section>

      <section aria-labelledby="news-heading" className="mt-24 sm:mt-32" id="news">
        <SectionHeading
          href="/news"
          index="03 / 国内新闻"
          title="今日脉冲"
          titleId="news-heading"
        />
        <div className="mb-10">
          <SourceFrequencyStrip
            ariaLabel="国内新闻来源频段"
            basePath="/news"
            sources={newsSources}
          />
        </div>
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
        <SectionHeading
          href="/social"
          index="04 / 社交热点"
          title="社区脉冲"
          titleId="social-heading"
        />
        <div className="mb-10">
          <SourceFrequencyStrip
            ariaLabel="社交热点来源频段"
            basePath="/social"
            sources={socialSources}
          />
        </div>
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
        <SectionHeading
          href="/finance"
          index="05 / 财经热点"
          title="市场脉冲"
          titleId="finance-heading"
        />
        <div className="mb-10">
          <SourceFrequencyStrip
            ariaLabel="财经热点来源频段"
            basePath="/finance"
            sources={financeSources}
          />
        </div>
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
        <SectionHeading
          href="/games"
          index="06 / 游戏热点"
          title="游玩脉冲"
          titleId="games-heading"
        />
        <div className="mb-10">
          <SourceFrequencyStrip
            ariaLabel="游戏热点来源频段"
            basePath="/games"
            sources={gameSources}
          />
        </div>
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
  index,
  title,
  titleId
}: {
  href: string
  index: string
  title: string
  titleId: string
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">{index}</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]" id={titleId}>
          {title}
        </h2>
      </div>
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
