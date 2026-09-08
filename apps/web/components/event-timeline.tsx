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
      <ol aria-label="AI 事件时间轴" className="pt-2">
        {items.map((event) => (
          <li
            key={event.id}
            className="group relative grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-4 sm:grid-cols-[7.5rem_1.25rem_minmax(0,1fr)] sm:gap-x-6"
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
              className="absolute inset-y-0 left-0 flex w-5 justify-center sm:left-[9rem]"
            >
              <span className="absolute bottom-0 top-3 w-px bg-border group-last:hidden" />
              <span className="relative mt-2 size-2.5 rounded-full border-2 border-primary bg-background group-first:bg-primary" />
            </div>
            <div className="col-start-2 min-w-0 pb-10 sm:col-start-3 sm:row-start-1 sm:pb-12">
              <h2 className="text-lg font-semibold leading-7 break-words sm:text-xl">
                <Link
                  className="hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                  href={`/ai/events/${event.slug}`}
                >
                  {event.title}
                </Link>
              </h2>
              <p className="mt-2 max-w-3xl text-pretty text-sm leading-7 break-words text-muted-foreground">
                {event.summary}
              </p>
              <Link
                className="mt-2 inline-flex min-h-11 items-center text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                href={`/ai/events/${event.slug}`}
              >
                查看事件与来源{' '}
                <span aria-hidden="true" className="ml-2">
                  →
                </span>
              </Link>
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
