import { SignalSkeleton } from '../../../../components/signal-skeleton'
import { SiteShell } from '../../../../components/site-shell'

export default function EventsLoading() {
  return (
    <SiteShell>
      <header className="mb-6 border-b border-border pb-6">
        <h1 className="headline-display text-balance text-3xl sm:text-4xl">AI 时间轴</h1>
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
