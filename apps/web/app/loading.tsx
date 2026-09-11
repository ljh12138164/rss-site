import { SignalSkeleton } from '../components/signal-skeleton'
import { SiteShell } from '../components/site-shell'

export default function Loading() {
  return (
    <SiteShell>
      <header className="pb-8 sm:pb-10">
        <h1 className="text-balance text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
          今日热点
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-sm leading-6 text-muted-foreground">
          汇总各分区的全部文章，按发布时间从新到旧阅读。
        </p>
      </header>
      <nav aria-label="内容分区" className="mb-10 min-w-0 border-b border-border">
        <p className="mb-1 text-xs font-medium text-muted-foreground">内容分区</p>
        <div className="flex gap-5 overflow-x-auto sm:flex-wrap sm:gap-x-7">
          <span className="flex min-h-11 shrink-0 items-center border-b-2 border-primary px-0.5 text-sm font-medium text-primary">
            全部
          </span>
          {(
            [
              ['/ai', 'AI'],
              ['/technology', '科技'],
              ['/news', '国内新闻'],
              ['/social', '社交热点'],
              ['/finance', '财经'],
              ['/games', '游戏'],
              ['/github', '开源排行']
            ] as const
          ).map(([href, title]) => (
            <span
              key={href}
              className="flex min-h-11 shrink-0 items-center whitespace-nowrap border-b-2 border-transparent px-0.5 text-sm text-muted-foreground"
            >
              {title}
            </span>
          ))}
        </div>
      </nav>
      <div className="min-w-0" aria-busy="true">
        <ol className="divide-y divide-border border-y border-border">
          {['01', '02', '03', '04', '05', '06', '07', '08'].map((pos) => (
            <li
              className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 py-5 sm:grid-cols-[3rem_minmax(0,1fr)] sm:gap-5"
              key={pos}
            >
              <span className="pt-0.5 font-mono text-sm font-semibold tabular-nums text-primary">
                {pos}
              </span>
              <div className="min-w-0">
                <SignalSkeleton className="h-6 w-3/4" />
                <SignalSkeleton className="mt-2 h-4 w-full" />
                <SignalSkeleton className="mt-1 h-4 w-2/3" />
                <SignalSkeleton className="mt-3 h-3 w-28" />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </SiteShell>
  )
}
