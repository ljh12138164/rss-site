import { SectionLoading } from '../../../components/section-loading'
import { SiteShell } from '../../../components/site-shell'

export default function EventsLoading() {
  return (
    <SiteShell>
      <header className="mb-8">
        <h1 className="text-4xl font-semibold text-balance sm:text-5xl">AI 时间轴</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          沿着时间，回顾 AI 的重要变化。每个事件都保留摘要与来源。
        </p>
      </header>
      <SectionLoading />
    </SiteShell>
  )
}
