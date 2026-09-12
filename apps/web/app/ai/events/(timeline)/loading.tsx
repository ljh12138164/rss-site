import { SignalSkeleton } from '../../../../components/signal-skeleton'
import { SiteShell } from '../../../../components/site-shell'

export default function EventsLoading() {
  return (
    <SiteShell>
      <header className="mb-8">
        <h1 className="text-4xl font-semibold text-balance sm:text-5xl">AI 时间轴</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          沿着时间，回顾 AI 的重要变化。每个事件都保留摘要与来源。
        </p>
      </header>
      <div role="status" aria-label="正在加载时间轴" className="pt-2">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="relative ml-2 border-l border-border pb-10 pl-7 sm:ml-[9.625rem] sm:pl-9"
          >
            <span
              aria-hidden="true"
              className="absolute -left-[5px] top-2 size-2.5 rounded-full border-2 border-primary bg-background"
            />
            <SignalSkeleton className="mb-3 h-4 w-24" />
            <SignalSkeleton className="h-6 w-3/4" />
            <SignalSkeleton className="mt-4 h-4 w-full max-w-2xl" />
            <SignalSkeleton className="mt-3 h-4 w-2/3" />
          </div>
        ))}
      </div>
    </SiteShell>
  )
}
