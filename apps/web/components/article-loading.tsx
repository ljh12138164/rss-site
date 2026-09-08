import { SignalSkeleton } from './signal-skeleton'
import { SiteShell } from './site-shell'

export default function ArticleLoading() {
  return (
    <SiteShell mainClassName="py-6 sm:py-10">
      <div aria-busy="true" className="mx-auto w-full max-w-[46rem] min-w-0" role="status">
        <span className="sr-only">正在加载文章</span>
        <SignalSkeleton className="h-4 w-40" />
        <SignalSkeleton className="mt-10 h-5 w-24" />
        <SignalSkeleton className="mt-5 h-12 w-full sm:w-5/6" />
        <SignalSkeleton className="mt-3 h-12 w-2/3" />
        <SignalSkeleton className="mt-7 h-4 w-52" />
        <div className="mt-10 space-y-3 border-y border-border py-7">
          <SignalSkeleton className="h-5 w-full" />
          <SignalSkeleton className="h-5 w-11/12" />
          <SignalSkeleton className="h-5 w-4/5" />
        </div>
        <SignalSkeleton className="mt-8 h-11 w-32" />
      </div>
    </SiteShell>
  )
}
