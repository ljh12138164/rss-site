import { SignalSkeleton } from './signal-skeleton'

export function SectionLoading() {
  return (
    <div role="status" aria-label="正在加载文章" className="border-y border-border">
      <span className="sr-only">正在加载文章…</span>
      {['one', 'two', 'three', 'four', 'five', 'six'].map((item, index) => (
        <div
          className="grid grid-cols-[6rem_minmax(0,1fr)] gap-3 border-b border-border py-4 last:border-b-0 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4"
          key={item}
        >
          <SignalSkeleton className="aspect-[8/5] w-full rounded-md" />
          <div>
            <SignalSkeleton className={index % 2 ? 'h-5 w-3/4' : 'h-5 w-5/6'} />
            <SignalSkeleton className="mt-3 h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
