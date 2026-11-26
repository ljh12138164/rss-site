import { SignalSkeleton } from '../../components/signal-skeleton'
import { TranslatedRegion } from '../../components/site-language'
import { SiteShell } from '../../components/site-shell'

export default function DailyLoading() {
  return (
    <SiteShell>
      <TranslatedRegion
        as="div"
        role="status"
        labelId="common.loading"
        className="grid gap-8 lg:grid-cols-[192px_minmax(0,1fr)]"
      >
        <div className="hidden space-y-2 lg:block">
          {[1, 2, 3, 4, 5].map((id) => (
            <SignalSkeleton key={id} className="h-14 w-full" />
          ))}
        </div>
        <div className="space-y-5">
          <SignalSkeleton className="h-32 w-full" />
          <SignalSkeleton className="h-28 w-full" />
          <SignalSkeleton className="h-64 w-full" />
        </div>
      </TranslatedRegion>
    </SiteShell>
  )
}
