import { Gamepad2 } from 'lucide-react'
import type { Metadata } from 'next'
import { SiteShell } from '../../components/site-shell'
import { SourceBand } from '../../components/source-band'
import { SourceFrequencyStrip } from '../../components/source-frequency-strip'
import { type GameFeeds, getGameFeeds } from '../../lib/hot-feed'
import { gameSources } from '../../lib/technology-sources'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '游戏热点',
  description: '来自 3DM、机核、游民星空、游侠网、indienova 与 Steam 的独立游戏信号。'
}

export function GamesView({ feeds }: { feeds: GameFeeds }) {
  return (
    <SiteShell>
      <header className="pb-12 sm:pb-16">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-primary">
          <Gamepad2 aria-hidden="true" className="size-3.5" />
          Games / Six channels
        </p>
        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
          游戏热点信号台
        </h1>
        <div className="mt-5 flex flex-col gap-3 text-sm leading-6 text-muted-foreground sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-xl">
            新闻、编辑文章与商店榜单分别保留原始顺序。Steam 显示当前热销榜快照，不伪造发布时间。
          </p>
          <p className="shrink-0 font-mono text-xs uppercase tracking-[0.1em]">
            Refresh window · 6H
          </p>
        </div>
        <div className="mt-9">
          <SourceFrequencyStrip
            ariaLabel="游戏热点来源频段"
            basePath="/games"
            sources={gameSources}
          />
        </div>
      </header>

      <div className="grid gap-x-10 gap-y-14 md:grid-cols-2">
        {gameSources.map((source) => (
          <SourceBand basePath="/games" feed={feeds[source.id]} key={source.id} source={source} />
        ))}
      </div>
    </SiteShell>
  )
}

export default async function GamesPage() {
  return <GamesView feeds={await getGameFeeds(3)} />
}
