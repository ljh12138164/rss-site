import { Bot } from 'lucide-react'
import type { Metadata } from 'next'
import { AiTimeline } from '../../components/ai-timeline'
import { EmptyFeed, FeedError } from '../../components/feed-state'
import { SiteShell } from '../../components/site-shell'
import { SourceFrequencyStrip } from '../../components/source-frequency-strip'
import { type AiTimelineResult, getAiTimeline } from '../../lib/hot-feed'
import { aiSources } from '../../lib/technology-sources'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'AI 平台时间线',
  description:
    '按发布日期追踪 OpenAI、Anthropic、DeepSeek、智谱 GLM、Google AI 和 Qwen 的官方动态。'
}

export function AiView({ timeline }: { timeline: AiTimelineResult }) {
  return (
    <SiteShell>
      <header className="pb-12 sm:pb-16">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-primary">
          <Bot aria-hidden="true" className="size-3.5" />
          AI event log / Six channels
        </p>
        <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
          AI 最近发生了什么
        </h1>
        <div className="mt-5 flex flex-col gap-3 text-sm leading-6 text-muted-foreground sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-xl">
            六个平台的官方发布按日期汇入同一条时间线。沿着信号轨迹浏览事件，也可以进入单个平台查看完整记录。
          </p>
          <p className="shrink-0 font-mono text-xs uppercase tracking-[0.1em]">
            {timeline.state === 'ready'
              ? `Latest ${timeline.items.length} signals`
              : 'Live data only'}
          </p>
        </div>
        <div className="mt-9">
          <SourceFrequencyStrip ariaLabel="AI 平台来源频段" basePath="/ai" sources={aiSources} />
        </div>
      </header>

      <section aria-labelledby="ai-timeline-heading">
        <div className="mb-8 flex items-end justify-between gap-4 border-t-2 border-foreground pt-5 sm:mb-10">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Chronological feed
            </p>
            <h2
              className="mt-2 text-2xl font-semibold tracking-[-0.035em]"
              id="ai-timeline-heading"
            >
              近期事件
            </h2>
          </div>
          <p className="hidden max-w-xs text-right text-xs leading-5 text-muted-foreground sm:block">
            日期采用 Asia/Shanghai；不补写上游未提供的具体时刻。
          </p>
        </div>

        {timeline.state === 'ready' ? (
          <AiTimeline items={timeline.items} />
        ) : timeline.state === 'empty' ? (
          <EmptyFeed />
        ) : (
          <FeedError />
        )}
      </section>
    </SiteShell>
  )
}

export default async function AiPage() {
  return <AiView timeline={await getAiTimeline()} />
}
