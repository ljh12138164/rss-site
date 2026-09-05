import { RadioTower } from 'lucide-react'
import type { Metadata } from 'next'
import { SiteShell } from '../../components/site-shell'
import { SourceBand } from '../../components/source-band'
import { SourceFrequencyStrip } from '../../components/source-frequency-strip'
import { getTechnologyFeeds, type TechnologyFeeds } from '../../lib/hot-feed'
import { technologySources } from '../../lib/technology-sources'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '科技热点',
  description: '来自 GitHub、Hacker News、掘金、V2EX、IT之家和 36氪的独立热点榜单。'
}

export function TechnologyView({ feeds }: { feeds: TechnologyFeeds }) {
  return (
    <SiteShell>
      <header className="pb-12 sm:pb-16">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-primary">
          <RadioTower aria-hidden="true" className="size-3.5" />
          Technology / Six channels
        </p>
        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">科技信号台</h1>
        <div className="mt-5 flex flex-col gap-3 text-sm leading-6 text-muted-foreground sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-xl">
            六个平台分别排序、分别更新时间。这里展示每路前三条，进入来源可查看完整榜单。
          </p>
          <p className="shrink-0 font-mono text-xs uppercase tracking-[0.1em]">
            Refresh window · 6H
          </p>
        </div>
        <div className="mt-9">
          <SourceFrequencyStrip />
        </div>
      </header>

      <div className="grid gap-x-10 gap-y-14 md:grid-cols-2">
        {technologySources.map((source) => (
          <SourceBand feed={feeds[source.id]} key={source.id} source={source} />
        ))}
      </div>
    </SiteShell>
  )
}

export default async function TechnologyPage() {
  return <TechnologyView feeds={await getTechnologyFeeds(3)} />
}
