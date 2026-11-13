import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { EventTimeline } from '../../../../components/event-timeline'
import { SiteShell } from '../../../../components/site-shell'
import { getEventPage } from '../../../../lib/ai-events'
import { createPageMetadata } from '../../../../lib/seo'

export const dynamic = 'force-dynamic'
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
      <header className="mb-6 flex items-center gap-2.5 border-b border-border pb-4">
        <span
          aria-hidden="true"
          className="size-3 shrink-0 rounded-full"
          style={{ backgroundColor: 'var(--line-ai)' }}
        />
        <h1 className="headline-display text-2xl text-foreground sm:text-3xl">AI 时间轴</h1>
      </header>
      <HydrationBoundary state={dehydrate(client)}>
        <EventTimeline initialPage={initialPage} />
      </HydrationBoundary>
    </SiteShell>
  )
}
