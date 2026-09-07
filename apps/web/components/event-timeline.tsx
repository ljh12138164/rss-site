'use client'

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import type { EventPage } from '../lib/ai-events'
import { ActionButton } from './action-button'

function pageOptions(cursor: string | null) {
  return {
    queryKey: ['ai-events', 'page', cursor],
    staleTime: 300000,
    queryFn: async ({ signal }: { signal: AbortSignal }): Promise<EventPage> => {
      const response = await fetch(
        `/api/events${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`,
        { signal, cache: 'no-store' }
      )
      if (!response.ok) throw new Error('Events unavailable')
      return response.json()
    }
  }
}
export function EventTimeline({ initialPage }: { initialPage: EventPage }) {
  const client = useQueryClient()
  const sentinel = useRef<HTMLDivElement>(null)
  const { data, fetchNextPage, hasNextPage, isFetching, isError } = useInfiniteQuery({
    queryKey: ['ai-events'],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => client.fetchQuery(pageOptions(pageParam)),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    initialData: { pages: [initialPage], pageParams: [null] },
    retry: false
  })
  const cursor = data.pages.at(-1)?.nextCursor
  useEffect(() => {
    if (cursor && !isError) void client.prefetchQuery(pageOptions(cursor))
  }, [client, cursor, isError])
  useEffect(() => {
    if (
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
  }, [hasNextPage, isFetching, isError, fetchNextPage])
  const items = [
    ...new Map(data.pages.flatMap((page) => page.items).map((item) => [item.id, item])).values()
  ]
  return (
    <div aria-busy={isFetching}>
      {!items.length && (
        <div className="border-y border-border py-10">
          <p className="text-muted-foreground">暂无已发布的 AI 事件。</p>
          <Link className="mt-4 inline-flex min-h-11 items-center text-primary" href="/ai">
            查看 AI 最新资讯
          </Link>
        </div>
      )}
      <ol className="divide-y divide-border">
        {items.map((event) => (
          <li key={event.id} className="grid gap-3 py-7 sm:grid-cols-[9rem_1fr]">
            <time
              className="text-sm tabular-nums text-muted-foreground"
              dateTime={event.occurred_at}
            >
              {new Date(event.occurred_at).toLocaleDateString('zh-CN', {
                timeZone: 'Asia/Shanghai'
              })}
            </time>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-balance">
                <Link
                  className="hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                  href={`/ai/events/${event.slug}`}
                >
                  {event.title}
                </Link>
              </h2>
              <p className="mt-3 text-pretty text-sm leading-7 text-muted-foreground">
                {event.summary}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <div ref={sentinel} className="flex min-h-24 flex-col items-center justify-center gap-3">
        <p role={isError ? 'alert' : 'status'} className="text-sm text-muted-foreground">
          {isFetching
            ? '正在加载事件…'
            : isError
              ? '暂时无法加载，请重试。'
              : hasNextPage
                ? '继续向下滚动，查看更早的事件'
                : items.length
                  ? '已显示全部事件'
                  : ''}
        </p>
        {(hasNextPage || isError) && (
          <ActionButton
            variant="outline"
            isDisabled={isFetching}
            onPress={() => void fetchNextPage({ cancelRefetch: false })}
          >
            {isError ? '重试' : '加载更多'}
          </ActionButton>
        )}
      </div>
    </div>
  )
}
