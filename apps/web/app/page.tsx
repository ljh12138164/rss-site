import { ArrowRight, RadioTower } from 'lucide-react'
import Link from 'next/link'
import { SiteShell } from '../components/site-shell'
import { SourceBand } from '../components/source-band'
import { SourceFrequencyStrip } from '../components/source-frequency-strip'
import { getTechnologyFeeds, type TechnologyFeeds } from '../lib/hot-feed'
import { technologySources } from '../lib/technology-sources'

export const dynamic = 'force-dynamic'

export function HomeView({ feeds }: { feeds: TechnologyFeeds }) {
  return (
    <SiteShell>
      <header className="pb-16 sm:pb-20">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-primary">
          <RadioTower aria-hidden="true" className="size-3.5" />
          Signal archive
        </p>
        <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.12] tracking-[-0.05em] sm:text-6xl">
          从六路信号里，
          <br />
          看清科技正在发生什么。
        </h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
          定时整理代码、社区与行业新闻。每个来源保持自己的顺序，不把不同平台硬凑成一个排行榜。
        </p>
        <div className="mt-10">
          <SourceFrequencyStrip />
        </div>
      </header>

      <section aria-labelledby="technology-heading" id="technology">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">01 / 科技</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]" id="technology-heading">
              当前信号
            </h2>
          </div>
          <Link
            className="group flex min-h-11 shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
            href="/technology"
          >
            查看总览
            <ArrowRight
              aria-hidden="true"
              className="size-3.5 transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        <div className="grid gap-x-10 gap-y-12 md:grid-cols-2">
          {technologySources.map((source) => (
            <SourceBand feed={feeds[source.id]} key={source.id} source={source} />
          ))}
        </div>
      </section>
    </SiteShell>
  )
}

export default async function HomePage() {
  return <HomeView feeds={await getTechnologyFeeds(1)} />
}
