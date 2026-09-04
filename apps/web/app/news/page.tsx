import { Newspaper } from 'lucide-react'
import type { Metadata } from 'next'
import { SiteShell } from '../../components/site-shell'
import { SourceBand } from '../../components/source-band'
import { SourceFrequencyStrip } from '../../components/source-frequency-strip'
import { getNewsFeeds, type NewsFeeds } from '../../lib/hot-feed'
import { newsSources } from '../../lib/technology-sources'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '国内新闻',
  description: '来自新华社、央视、中新网、澎湃、界面和百度的独立新闻信号。'
}

export function NewsView({ feeds }: { feeds: NewsFeeds }) {
  return (
    <SiteShell>
      <header className="pb-12 sm:pb-16">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-primary">
          <Newspaper aria-hidden="true" className="size-3.5" />
          News / Six channels
        </p>
        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
          国内新闻信号台
        </h1>
        <div className="mt-5 flex flex-col gap-3 text-sm leading-6 text-muted-foreground sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-xl">
            六个平台分别保留栏目、热榜或热搜顺序。这里展示每路前三条，进入来源可查看完整列表。
          </p>
          <p className="shrink-0 font-mono text-xs uppercase tracking-[0.1em]">
            Refresh window · 5H
          </p>
        </div>
        <div className="mt-9">
          <SourceFrequencyStrip
            ariaLabel="国内新闻来源频段"
            basePath="/news"
            sources={newsSources}
          />
        </div>
      </header>

      <div className="grid gap-x-10 gap-y-14 md:grid-cols-2">
        {newsSources.map((source) => (
          <SourceBand basePath="/news" feed={feeds[source.id]} key={source.id} source={source} />
        ))}
      </div>
    </SiteShell>
  )
}

export default async function NewsPage() {
  return <NewsView feeds={await getNewsFeeds(3)} />
}
