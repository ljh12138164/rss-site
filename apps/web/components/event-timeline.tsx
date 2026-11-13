'use client'

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { hc } from 'hono/client'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import type { EventPage } from '../lib/ai-events'
import type { AppType } from '../lib/hono-app'
import { ActionButton } from './action-button'
import { EventSources } from './event-sources'

const api = hc<AppType>('/')

function pageOptions(cursor: string | null) {
  return {
    queryKey: ['ai-events', 'page', cursor],
    staleTime: 300000,
    queryFn: async ({ signal }: { signal: AbortSignal }): Promise<EventPage> => {
      const response = await api.api.events.$get(
        { query: { cursor: cursor ?? undefined } },
        { init: { signal, cache: 'no-store' } }
      )
      if (response.status !== 200) throw new Error('Events unavailable')
      return response.json()
    }
  }
}
export function EventTimeline({
  initialPage,
  archive = false
}: {
  initialPage: EventPage
  archive?: boolean
}) {
  const client = useQueryClient()
  const sentinel = useRef<HTMLDivElement>(null)
  const { data, fetchNextPage, hasNextPage, isFetching, isError } = useInfiniteQuery({
    queryKey: archive ? ['ai-events', 'archive', initialPage.items[0]?.id] : ['ai-events'],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => client.fetchQuery(pageOptions(pageParam)),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    initialData: { pages: [initialPage], pageParams: [null] },
    retry: false,
    enabled: !archive
  })
  const cursor = data.pages.at(-1)?.nextCursor
  useEffect(() => {
    if (cursor && !isError && !archive) void client.prefetchQuery(pageOptions(cursor))
  }, [client, cursor, isError, archive])
  useEffect(() => {
    if (
      archive ||
      !sentinel.current ||
      !hasNextPage ||
      isFetching ||
      isError ||
      !('IntersectionObserver' in window)
    )
      return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting))
          void fetchNextPage({ cancelRefetch: false })
      },
      { rootMargin: '400px' }
    )
    observer.observe(sentinel.current)
    return () => observer.disconnect()
  }, [hasNextPage, isFetching, isError, fetchNextPage, archive])
  const items = [
    ...new Map(data.pages.flatMap((page) => page.items).map((item) => [item.id, item])).values()
  ]
  return (
    <div aria-busy={isFetching}>
      {!items.length && (
        <div className="rounded-sm border border-border bg-card py-10 text-center">
          <p className="text-sm text-muted-foreground">暂无已发布的 AI 事件</p>
          <Link
            className="mt-4 inline-flex min-h-10 items-center text-xs font-medium text-primary hover:underline"
            href="/ai"
          >
            查看 AI 频道 →
          </Link>
        </div>
      )}
      <ol aria-label="AI 事件时间轴" className="pt-2">
        {items.map((event) => (
          <li
            key={event.id}
            className="group relative grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-4 sm:grid-cols-[6.5rem_1.25rem_minmax(0,1fr)] sm:gap-x-5"
          >
            <time
              className="col-start-2 mb-2 pt-0.5 font-mono text-xs leading-6 tabular-nums text-muted-foreground sm:col-start-1 sm:row-start-1 sm:text-right"
              dateTime={event.occurred_at}
            >
              {new Date(event.occurred_at).toLocaleDateString('zh-CN', {
                timeZone: 'Asia/Shanghai'
              })}
            </time>
            <div
              aria-hidden="true"
              className="absolute inset-y-0 left-0 flex w-5 justify-center sm:left-[7.75rem]"
            >
              <span
                className="absolute top-3 bottom-0 w-[2px] opacity-40 group-last:hidden"
                style={{ backgroundColor: 'var(--line-ai)' }}
              />
              <span
                className="relative mt-2 size-3 rounded-full border-2 bg-background"
                style={{ borderColor: 'var(--line-ai)' }}
              />
            </div>
            <div className="col-start-2 min-w-0 pb-6 sm:col-start-3 sm:row-start-1 sm:pb-7">
              <div className="rounded-sm border border-border bg-card p-4 transition-colors hover:border-strong sm:p-5">
                <EventSources sources={event.sources ?? []} />
                <h2 className="mt-2 text-base font-semibold leading-6 break-words sm:text-lg">
                  <Link
                    className="hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
                    href={`/ai/events/${event.slug}`}
                  >
                    {event.title}
                  </Link>
                </h2>
                <p className="mt-2 max-w-3xl text-pretty text-sm leading-6 break-words text-muted-foreground">
                  {event.summary}
                </p>
                <Link
                  className="mt-3 inline-flex items-center font-mono text-xs font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                  href={`/ai/events/${event.slug}`}
                >
                  详情与来源 →
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <div ref={sentinel} className="flex min-h-20 flex-col items-center justify-center gap-3 py-4">
        <p role={isError ? 'alert' : 'status'} className="font-mono text-xs text-muted-foreground">
          {isFetching
            ? '加载中…'
            : isError
              ? '加载失败，请重试'
              : hasNextPage
                ? archive
                  ? ''
                  : ''
                : items.length
                  ? '已显示全部事件'
                  : ''}
        </p>
        {!archive && (hasNextPage || isError) && (
          <ActionButton
            variant="outline"
            isDisabled={isFetching}
            onPress={() => void fetchNextPage({ cancelRefetch: false })}
          >
            {isError ? '重试' : '加载更多'}
          </ActionButton>
        )}
        {cursor && (
          <Link
            href={`/ai/events/archive?cursor=${encodeURIComponent(cursor)}`}
            prefetch={false}
            className="inline-flex min-h-10 items-center text-xs font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
          >
            更早事件 →
          </Link>
        )}
      </div>
    </div>
  )
}
