import { SignalSkeleton } from '../../components/signal-skeleton'
import { SiteShell } from '../../components/site-shell'

export default function GamesLoading() {
  return (
    <SiteShell>
      <SignalSkeleton className="h-3 w-40" />
      <SignalSkeleton className="mt-7 h-12 w-2/3" />
      <SignalSkeleton className="mt-5 h-5 w-4/5" />
      <div className="mt-12 grid gap-x-10 gap-y-14 md:grid-cols-2">
        {['3d', 'gc', 'gs', 'a21', 'in', 'st'].map((source) => (
          <div className="border-t-2 border-border pt-5" key={source}>
            <SignalSkeleton className="h-3 w-16" />
            <SignalSkeleton className="mt-4 h-7 w-2/3" />
            <SignalSkeleton className="mt-10 h-16 w-full" />
          </div>
        ))}
      </div>
    </SiteShell>
  )
}
