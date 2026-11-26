import { SignalSkeleton } from './signal-skeleton'
import { TranslatedRegion, TranslatedText } from './site-language'

export function SectionLoading() {
  return (
    <TranslatedRegion
      as="div"
      role="status"
      labelId="common.loading"
      aria-busy="true"
      className="divide-y divide-border rounded-sm border border-border bg-card"
    >
      <span className="sr-only">
        <TranslatedText id="common.loadingEllipsis" />
      </span>
      {['one', 'two', 'three', 'four', 'five', 'six'].map((item, index) => (
        <div key={item} className="px-4 py-4 sm:px-5">
          <SignalSkeleton className={index % 2 === 0 ? 'h-5 w-4/5' : 'h-5 w-3/4'} />
          <SignalSkeleton className="mt-2 h-3.5 w-36" />
        </div>
      ))}
    </TranslatedRegion>
  )
}
