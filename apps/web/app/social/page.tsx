import { MessagesSquare } from 'lucide-react'
import type { Metadata } from 'next'
import { SiteShell } from '../../components/site-shell'
import { SourceBand } from '../../components/source-band'
import { SourceFrequencyStrip } from '../../components/source-frequency-strip'
import { getSocialFeeds, type SocialFeeds } from '../../lib/hot-feed'
import { socialSources } from '../../lib/technology-sources'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '社交热点',
  description: '来自哔哩哔哩、知乎、酷安、虎扑、少数派和今日头条的公开热门内容。'
}

export function SocialView({ feeds }: { feeds: SocialFeeds }) {
  return (
    <SiteShell>
      <header className="pb-12 sm:pb-16">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-primary">
          <MessagesSquare aria-hidden="true" className="size-3.5" />
          Social pulse / Six channels
        </p>
        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
          社交热点信号台
        </h1>
        <div className="mt-5 flex flex-col gap-3 text-sm leading-6 text-muted-foreground sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-xl">
            六个平台的公开热门内容分别保持原有顺序。这里展示每路前三条，进入来源可查看完整列表。
          </p>
          <p className="shrink-0 font-mono text-xs uppercase tracking-[0.1em]">
            Refresh window · 5H
          </p>
        </div>
        <div className="mt-9">
          <SourceFrequencyStrip
            ariaLabel="社交热点来源频段"
            basePath="/social"
            sources={socialSources}
          />
        </div>
      </header>

      <div className="grid gap-x-10 gap-y-14 md:grid-cols-2">
        {socialSources.map((source) => (
          <SourceBand basePath="/social" feed={feeds[source.id]} key={source.id} source={source} />
        ))}
      </div>
    </SiteShell>
  )
}

export default async function SocialPage() {
  return <SocialView feeds={await getSocialFeeds(3)} />
}
