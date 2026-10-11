import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { EventTimeline } from '../../../../components/event-timeline'
import { SiteShell } from '../../../../components/site-shell'
import { getEventPage, parseEventCursor } from '../../../../lib/ai-events'
import { createPageMetadata } from '../../../../lib/seo'

export const dynamic = 'force-dynamic'
type Props = { searchParams: Promise<{ cursor?: string | string[] }> }

async function resolve({ searchParams }: Props) {
  const { cursor } = await searchParams
  if (!cursor) redirect('/ai/events')
  if (typeof cursor !== 'string') notFound()
  try {
    parseEventCursor(cursor)
  } catch {
    notFound()
  }
  return cursor
}

export async function generateMetadata(props: Props) {
  const cursor = await resolve(props)
  return createPageMetadata({
    title: 'AI 时间轴 · 更早事件',
    description: '回顾更早的 AI 事件、摘要与真实来源。',
    path: `/ai/events/archive?cursor=${encodeURIComponent(cursor)}`
  })
}

export default async function EventArchive(props: Props) {
  const page = await getEventPage(await resolve(props))
  if (!page.items.length) notFound()
  return (
    <SiteShell>
      <header className="mb-8">
        <Link
          href="/ai/events"
          className="inline-flex min-h-11 items-center text-sm text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
        >
          返回 AI 时间轴
        </Link>
        <h1 className="headline-display mt-3 text-balance text-4xl">AI 时间轴 · 更早事件</h1>
      </header>
      <EventTimeline initialPage={page} archive />
    </SiteShell>
  )
}
