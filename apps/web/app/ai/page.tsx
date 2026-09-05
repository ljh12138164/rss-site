import { Bot } from 'lucide-react'
import type { Metadata } from 'next'
import { SiteShell } from '../../components/site-shell'
import { SourceBand } from '../../components/source-band'
import { SourceFrequencyStrip } from '../../components/source-frequency-strip'
import { type AiFeeds, getAiFeeds } from '../../lib/hot-feed'
import { aiSources } from '../../lib/technology-sources'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'AI 平台文章',
  description: '来自 OpenAI、Anthropic、DeepSeek、智谱 GLM、Google AI 和 Qwen 的官方文章。'
}

export function AiView({ feeds }: { feeds: AiFeeds }) {
  return (
    <SiteShell>
      <header className="pb-12 sm:pb-16">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-primary">
          <Bot aria-hidden="true" className="size-3.5" />
          AI platforms / Six channels
        </p>
        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
          AI 平台信号台
        </h1>
        <div className="mt-5 flex flex-col gap-3 text-sm leading-6 text-muted-foreground sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-xl">
            六个平台的官方发布分别按原始时间线整理。这里展示每路前三条，进入来源可查看完整列表。
          </p>
          <p className="shrink-0 font-mono text-xs uppercase tracking-[0.1em]">
            Refresh window · 5H
          </p>
        </div>
        <div className="mt-9">
          <SourceFrequencyStrip ariaLabel="AI 平台来源频段" basePath="/ai" sources={aiSources} />
        </div>
      </header>

      <div className="grid gap-x-10 gap-y-14 md:grid-cols-2">
        {aiSources.map((source) => (
          <SourceBand basePath="/ai" feed={feeds[source.id]} key={source.id} source={source} />
        ))}
      </div>
    </SiteShell>
  )
}

export default async function AiPage() {
  return <AiView feeds={await getAiFeeds(3)} />
}
