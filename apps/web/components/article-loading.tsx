import { SignalSkeleton } from './signal-skeleton'
import { TranslatedText } from './site-language'
import { SiteShell } from './site-shell'

export default function ArticleLoading() {
  return (
    <SiteShell mainClassName="py-6 sm:py-10">
      <div className="mx-auto w-full max-w-[46rem] space-y-5" role="status" aria-busy="true">
        <span className="sr-only">
          <TranslatedText id="article.loading" />
        </span>
        <SignalSkeleton className="h-4 w-40" />
        <SignalSkeleton className="h-10 w-5/6" />
        <SignalSkeleton className="h-4 w-64" />
        <div className="space-y-3 border-t border-border pt-8">
          <SignalSkeleton className="h-4 w-full" />
          <SignalSkeleton className="h-4 w-11/12" />
          <SignalSkeleton className="h-4 w-4/5" />
          <SignalSkeleton className="h-4 w-full" />
        </div>
      </div>
    </SiteShell>
  )
}
