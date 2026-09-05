import { SignalSkeleton } from '../components/signal-skeleton'
import { SiteShell } from '../components/site-shell'

export default function Loading() {
  return (
    <SiteShell>
      <SignalSkeleton className="h-3 w-28" />
      <SignalSkeleton className="mt-7 h-12 w-4/5" />
      <SignalSkeleton className="mt-3 h-12 w-3/5" />
      <SignalSkeleton className="mt-7 h-5 w-3/4" />
      <div className="mt-24 space-y-5 border-y border-border py-5">
        {['first', 'second', 'third', 'fourth', 'fifth'].map((item) => (
          <div className="grid grid-cols-[2.5rem_1fr] gap-3" key={item}>
            <SignalSkeleton className="h-4 w-6" />
            <div>
              <SignalSkeleton className="h-5 w-4/5" />
              <SignalSkeleton className="mt-3 h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </SiteShell>
  )
}
