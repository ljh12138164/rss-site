import { SignalSkeleton } from './signal-skeleton'
import { SiteShell } from './site-shell'

export function SectionLoading() {
  return (
    <SiteShell>
      <header className="pb-8 sm:pb-10">
        <SignalSkeleton className="h-12 w-40" />
        <SignalSkeleton className="mt-5 h-4 w-full max-w-xl" />
      </header>

      <div className="border-b border-border" data-skeleton-region="sources">
        <SignalSkeleton className="mb-2 h-3 w-16" />
        <div className="flex gap-5 overflow-hidden sm:gap-7">
          {['all', 'one', 'two', 'three', 'four', 'five', 'six'].map((item) => (
            <SignalSkeleton className="h-11 w-20 shrink-0" key={item} />
          ))}
        </div>
      </div>

      <div className="mt-10 space-y-14">
        {['first', 'second', 'third'].map((section) => (
          <div className="border-t border-border pt-6" key={section}>
            <SignalSkeleton className="h-7 w-40" />
            <SignalSkeleton className="mt-3 h-4 w-64 max-w-full" />
            <div className="mt-7 divide-y divide-border border-y border-border">
              {['one', 'two', 'three'].map((item, index) => (
                <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2 py-4" key={item}>
                  <SignalSkeleton className="h-4 w-5" />
                  <SignalSkeleton className={index === 1 ? 'h-5 w-3/4' : 'h-5 w-5/6'} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SiteShell>
  )
}
