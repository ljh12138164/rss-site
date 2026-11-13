import { SignalSkeleton } from './signal-skeleton'

export function SectionLoading() {
  return (
    <div
      role="status"
      aria-label="加载中"
      className="divide-y divide-border rounded-sm border border-border bg-card"
    >
      <span className="sr-only">正在加载…</span>
      {['one', 'two', 'three', 'four', 'five', 'six'].map((item, index) => (
        <div className="px-4 py-4 sm:px-5" key={item}>
          <SignalSkeleton className={index % 2 ? 'h-5 w-3/4' : 'h-5 w-5/6'} />
          <SignalSkeleton className="mt-2.5 h-3.5 w-36" />
        </div>
      ))}
    </div>
  )
}
