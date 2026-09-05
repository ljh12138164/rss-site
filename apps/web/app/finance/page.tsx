import { Landmark } from 'lucide-react'
import type { Metadata } from 'next'
import { SiteShell } from '../../components/site-shell'
import { SourceBand } from '../../components/source-band'
import { SourceFrequencyStrip } from '../../components/source-frequency-strip'
import { type FinanceFeeds, getFinanceFeeds } from '../../lib/hot-feed'
import { financeSources } from '../../lib/technology-sources'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '财经热点',
  description: '来自华尔街见闻、财联社、金十数据、第一财经、证券时报和同花顺财经的独立信号。'
}

export function FinanceView({ feeds }: { feeds: FinanceFeeds }) {
  return (
    <SiteShell>
      <header className="pb-12 sm:pb-16">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-primary">
          <Landmark aria-hidden="true" className="size-3.5" />
          Finance / Six channels
        </p>
        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
          财经热点信号台
        </h1>
        <div className="mt-5 flex flex-col gap-3 text-sm leading-6 text-muted-foreground sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-xl">
            六个平台分别保留热榜、头条或快讯顺序。这里只做信息聚合，不构成投资建议。
          </p>
          <p className="shrink-0 font-mono text-xs uppercase tracking-[0.1em]">
            Refresh window · 6H
          </p>
        </div>
        <div className="mt-9">
          <SourceFrequencyStrip
            ariaLabel="财经热点来源频段"
            basePath="/finance"
            sources={financeSources}
          />
        </div>
      </header>

      <div className="grid gap-x-10 gap-y-14 md:grid-cols-2">
        {financeSources.map((source) => (
          <SourceBand basePath="/finance" feed={feeds[source.id]} key={source.id} source={source} />
        ))}
      </div>
    </SiteShell>
  )
}

export default async function FinancePage() {
  return <FinanceView feeds={await getFinanceFeeds(3)} />
}
