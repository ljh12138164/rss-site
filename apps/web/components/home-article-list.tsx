'use client'

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useCallback, useEffect, useRef } from 'react'
import { articleArchiveHref } from '../lib/article-archive'
import { articlePageOptions, articleQueryKey } from '../lib/article-query'
import type { ArticleFilter, HomeArticlePage } from '../lib/home-articles'
import { useReadingList } from '../lib/reading-list'
import { ActionButton } from './action-button'
import { HotList } from './hot-list'

export function HomeArticleList({
  initialPage,
  initialError = false,
  section,
  source,
  sources,
  unreadOnly = false
}: {
  initialPage?: HomeArticlePage
  initialError?: boolean
  unreadOnly?: boolean
} & ArticleFilter) {
  const client = useQueryClient()
  const { readingHistory } = useReadingList()
  const readIds = new Set(readingHistory.map((item) => item.id))
  const sentinel = useRef<HTMLDivElement>(null)
  const { data, fetchNextPage, hasNextPage, isFetching, isError, refetch } = useInfiniteQuery({
    queryKey: articleQueryKey({ section, source, sources }),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      client.fetchQuery(articlePageOptions({ section, source, sources }, pageParam)),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialData:
      initialError || !initialPage ? undefined : { pages: [initialPage], pageParams: [null] },
    enabled: !initialError,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false
  })
  const pages = data?.pages ?? []
  const seen = new Set<string>()
  const items = pages
    .flatMap((page) => page.items)
    .filter((item) => {
      if (seen.has(item.articleId)) return false
      seen.add(item.articleId)
      return !unreadOnly || !readIds.has(item.articleId)
    })
  const nextCursor = pages.at(-1)?.nextCursor ?? null
  const archiveHref =
    nextCursor && !unreadOnly
      ? articleArchiveHref({ section, source, sources }, nextCursor)
      : undefined
  const error = isError || (initialError && !data)

  useEffect(() => {
    if (nextCursor && !error)
      void client.prefetchQuery(articlePageOptions({ section, source, sources }, nextCursor))
  }, [client, nextCursor, section, source, sources, error])

  const loadMore = useCallback(async () => {
    if (isFetching) return
    if (!data) await refetch()
    else if (hasNextPage) await fetchNextPage({ cancelRefetch: false })
  }, [isFetching, data, refetch, hasNextPage, fetchNextPage])

  useEffect(() => {
    if (
      !sentinel.current ||
      !hasNextPage ||
      isFetching ||
      error ||
      !('IntersectionObserver' in window)
    )
      return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore()
      },
      { rootMargin: '400px' }
    )
    observer.observe(sentinel.current)
    return () => observer.disconnect()
  }, [hasNextPage, isFetching, error, loadMore])

  return (
    <div className="min-w-0" aria-busy={isFetching}>
      <HotList
        returnTo={section ?? '/'}
        source={source}
        items={items.map((item, index) => ({
          ...item,
          platform: source ? undefined : item.platform,
          position: source === 'github' ? item.position : index + 1,
          publishedAt: item.publishedAt ? new Date(item.publishedAt) : null
        }))}
      />
      <div ref={sentinel} className="flex min-h-24 flex-col items-center justify-center gap-3 py-6">
        <p role={error ? 'alert' : 'status'} className="text-sm text-muted-foreground">
          {isFetching
            ? source === 'github'
              ? '正在加载更多项目…'
              : '正在加载更多文章…'
            : error
              ? '暂时无法加载，请重试。'
              : hasNextPage
                ? source === 'github'
                  ? '继续向下滚动，加载更多项目'
                  : '继续向下滚动，加载更多文章'
                : items.length
                  ? '已显示全部内容。'
                  : unreadOnly
                    ? '没有未读文章。'
                    : '暂无内容。'}
        </p>
        {(hasNextPage || error) && (
          <ActionButton variant="outline" isDisabled={isFetching} onPress={() => void loadMore()}>
            {error ? '重试' : '加载更多'}
          </ActionButton>
        )}
        {archiveHref && (
          <Link
            href={archiveHref}
            prefetch={false}
            className="inline-flex min-h-11 items-center text-sm text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
          >
            查看更早文章
          </Link>
        )}
      </div>
    </div>
  )
}
