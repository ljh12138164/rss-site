import { SignalSkeleton } from './signal-skeleton'
import { SiteShell } from './site-shell'

export function SectionLoading() {
  return (
    <SiteShell>
      <header className="border-b border-border pb-8 sm:pb-10">
        <SignalSkeleton className="h-12 w-40" />
        <SignalSkeleton className="mt-5 h-4 w-full max-w-xl" />
      </header>
      <div className="mt-8 lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-12">
        <div className="flex gap-2 overflow-hidden lg:flex-col">
          {['all', 'one', 'two', 'three', 'four', 'five', 'six'].map((item) => (
            <SignalSkeleton className="h-11 w-28 shrink-0 lg:w-full" key={item} />
          ))}
        </div>
        <div className="mt-10 space-y-12 lg:mt-0">
          {['first', 'second', 'third'].map((item) => (
            <div className="border-t border-border pt-6" key={item}>
              <SignalSkeleton className="h-7 w-40" />
              <SignalSkeleton className="mt-3 h-4 w-64 max-w-full" />
              <div className="mt-7 space-y-4 border-y border-border py-4">
                <SignalSkeleton className="h-5 w-5/6" />
                <SignalSkeleton className="h-5 w-3/4" />
                <SignalSkeleton className="h-5 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SiteShell>
  )
}
