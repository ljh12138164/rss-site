import { SignalSkeleton } from '../../components/signal-skeleton'
import { SiteShell } from '../../components/site-shell'

/** Digest-shaped skeleton matching the editorial homepage layout. */
export default function Loading() {
  return (
    <SiteShell mainClassName="pt-8 sm:pt-10">
      <header className="border-b border-border pb-7 sm:pb-9">
        <SignalSkeleton className="h-3 w-40" />
        <SignalSkeleton className="mt-4 h-12 w-72 sm:h-14" />
        <SignalSkeleton className="mt-4 h-4 w-full max-w-xl" />
      </header>
      <section aria-busy="true" className="mt-10">
        <SignalSkeleton className="h-3 w-44" />
        <ol className="mt-4 border-y border-border">
          {['01', '02', '03', '04', '05'].map((pos) => (
            <li
              className="-mx-2 grid grid-cols-[2.5rem_minmax(0,1fr)] items-baseline gap-3 border-b border-border px-2 py-4 last:border-b-0 sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-5"
              key={pos}
            >
              <span className="rank-numeral">{pos}</span>
              <div className="min-w-0">
                <SignalSkeleton className="h-6 w-3/4" />
                <SignalSkeleton className="mt-2 h-3 w-28" />
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section aria-busy="true" className="mt-12">
        <SignalSkeleton className="h-3 w-44" />
        <div className="mt-4 grid grid-cols-1 gap-px border-y border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {['technology', 'ai', 'social', 'news', 'finance', 'games'].map((section) => (
            <div className="bg-background p-5" key={section}>
              <SignalSkeleton className="h-6 w-24" />
              <div className="mt-4 space-y-3 border-t border-border pt-4">
                <SignalSkeleton className="h-4 w-full" />
                <SignalSkeleton className="h-4 w-5/6" />
                <SignalSkeleton className="h-4 w-2/3" />
              </div>
              <SignalSkeleton className="mt-4 h-4 w-20" />
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  )
}
