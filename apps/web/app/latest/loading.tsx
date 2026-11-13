import { SignalSkeleton } from '../../components/signal-skeleton'
import { SiteShell } from '../../components/site-shell'

export default function Loading() {
  return (
    <SiteShell>
      <div className="space-y-8" aria-busy="true">
        <div className="space-y-4">
          <SignalSkeleton className="h-8 w-36" />
          <div className="flex flex-wrap gap-2">
            {['ai', 'tech', 'news', 'social', 'finance', 'games'].map((id) => (
              <SignalSkeleton key={id} className="h-9 w-20" />
            ))}
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <SignalSkeleton className="h-6 w-32" />
            {[1, 2, 3, 4].map((row) => (
              <div key={row} className="rounded-sm border border-border bg-card p-5">
                <SignalSkeleton className="h-4 w-28" />
                <SignalSkeleton className="mt-3 h-5 w-4/5" />
                <SignalSkeleton className="mt-2 h-4 w-full" />
              </div>
            ))}
          </div>
          <div className="hidden space-y-5 xl:block">
            <SignalSkeleton className="h-56 w-full" />
            <SignalSkeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    </SiteShell>
  )
}
