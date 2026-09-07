'use client'

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'
import { articlePageOptions, articleQueryKey } from '../lib/article-query'
import type { ArticleFilter, HomeArticlePage } from '../lib/home-articles'
import { ActionButton } from './action-button'
import { HotList } from './hot-list'

export function HomeArticleList({
  initialPage,
  initialError = false,
  section,
  source
}: { initialPage: HomeArticlePage; initialError?: boolean } & ArticleFilter) {
  const client = useQueryClient()
  const sentinel = useRef<HTMLDivElement>(null)
  const { data, fetchNextPage, hasNextPage, isFetching, isError, refetch } = useInfiniteQuery({
    queryKey: articleQueryKey({ section, source }),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      client.fetchQuery(articlePageOptions({ section, source }, pageParam)),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialData: initialError ? undefined : { pages: [initialPage], pageParams: [null] },
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
      return true
    })
  const nextCursor = pages.at(-1)?.nextCursor ?? null
  const error = isError || (initialError && !data)

  useEffect(() => {
    if (nextCursor && !error)
      void client.prefetchQuery(articlePageOptions({ section, source }, nextCursor))
  }, [client, nextCursor, section, source, error])

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
                  : '暂无内容。'}
        </p>
        {(hasNextPage || error) && (
          <ActionButton variant="outline" isDisabled={isFetching} onPress={() => void loadMore()}>
            {error ? '重试' : '加载更多'}
          </ActionButton>
        )}
      </div>
    </div>
  )
}
