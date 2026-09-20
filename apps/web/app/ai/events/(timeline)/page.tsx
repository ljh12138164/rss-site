import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { EventTimeline } from '../../../../components/event-timeline'
import { SiteShell } from '../../../../components/site-shell'
import { getEventPage } from '../../../../lib/ai-events'
import { createPageMetadata } from '../../../../lib/seo'

export const dynamic = 'force-static'
export const revalidate = 7200
export function generateMetadata() {
  return createPageMetadata({
    title: 'AI 时间轴',
    description: '按时间回顾 AI 事件、背景摘要与相关来源。',
    path: '/ai/events'
  })
}
export default async function EventsPage() {
  const initialPage = await getEventPage()
  const client = new QueryClient()
  client.setQueryData(['ai-events'], { pages: [initialPage], pageParams: [null] })
  return (
    <SiteShell>
      <header className="mb-8 border-b border-strong pb-7 sm:pb-9">
        <p className="eyebrow">AI Events · 大事记</p>
        <h1 className="headline-display mt-3 text-4xl leading-[1.1] sm:text-5xl">AI 时间轴</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          沿着时间，回顾 AI 的重要变化。每个事件都保留摘要与来源。
        </p>
      </header>
      <HydrationBoundary state={dehydrate(client)}>
        <EventTimeline initialPage={initialPage} />
      </HydrationBoundary>
    </SiteShell>
  )
}
