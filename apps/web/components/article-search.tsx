'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { ArrowUpRight, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogTrigger,
  Heading,
  Input,
  Link,
  Modal,
  ModalOverlay,
  TextField
} from 'react-aria-components'
import { createNewsArticlePath } from '../lib/article-route'
import { type SearchArticle, searchValidation } from '../lib/article-search'
import {
  aiSources,
  financeSources,
  gameSources,
  newsSources,
  socialSources,
  technologySources
} from '../lib/technology-sources'
import { ActionButton } from './action-button'

const sources = [
  ...aiSources,
  ...financeSources,
  ...gameSources,
  ...newsSources,
  ...socialSources,
  ...technologySources
]

export function Highlight({ text, query }: { text: string; query: string }) {
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (!escaped) return text
  let offset = 0
  return text.split(new RegExp(`(${escaped})`, 'gi')).map((part, index) => {
    const key = offset
    offset += part.length
    return index % 2 ? (
      <mark
        className="rounded-sm bg-search-highlight px-0.5 font-semibold text-search-highlight-foreground"
        key={key}
      >
        {part}
      </mark>
    ) : (
      part
    )
  })
}

function SearchPanel() {
  const [value, setValue] = useState('')
  const [composing, setComposing] = useState(false)
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const query = value.trim()
  const validation = searchValidation(query)
  useEffect(() => {
    if (validation || composing) return
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query, validation, composing])
  const ready = !validation && !composing && debouncedQuery === query
  const { data, isFetching, isError, hasNextPage, fetchNextPage, refetch } = useInfiniteQuery({
    queryKey: ['article-search', debouncedQuery],
    initialPageParam: 0,
    enabled: ready && !!debouncedQuery,
    staleTime: 300000,
    gcTime: 1800000,
    queryFn: async ({
      pageParam,
      signal
    }): Promise<{ items: SearchArticle[]; hasMore: boolean }> => {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(debouncedQuery)}&page=${pageParam}`,
        { signal, cache: 'no-store' }
      )
      if (!response.ok) throw new Error('Search unavailable')
      return response.json()
    },
    getNextPageParam: (lastPage, pages) => (lastPage.hasMore ? pages.length : undefined)
  })
  const pending = !validation && !composing && (!ready || isFetching)
  const items = ready
    ? [
        ...new Map(
          (data?.pages ?? []).flatMap((page) => page.items).map((item) => [item.id, item])
        ).values()
      ]
    : []
  const error = ready && isError ? '暂时无法搜索，请重试' : null
  return (
    <>
      <div className="flex items-center justify-between px-5 pt-5">
        <Heading slot="title" className="text-balance text-base font-semibold">
          搜索文章
        </Heading>
        <ActionButton slot="close" variant="ghost" size="icon" aria-label="关闭搜索">
          <X aria-hidden="true" />
        </ActionButton>
      </div>
      <TextField
        aria-label="搜索标题和摘要"
        value={value}
        onChange={setValue}
        className="mx-5 mt-3 flex min-h-12 items-center gap-3 rounded-md border border-border bg-muted/40 px-3 focus-within:ring-2 focus-within:ring-primary"
      >
        <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <Input
          role="searchbox"
          autoFocus
          maxLength={80}
          placeholder="搜索标题和摘要…"
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
          className="min-w-0 flex-1 bg-transparent py-3 text-base outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <ActionButton
            aria-label="清空关键词"
            variant="ghost"
            size="icon"
            onPress={() => {
              setValue('')
            }}
          >
            <X aria-hidden="true" />
          </ActionButton>
        )}
      </TextField>
      <div className="px-5 py-4 text-sm text-muted-foreground" role="status" aria-live="polite">
        {!query
          ? '输入关键词，查找标题和摘要'
          : composing
            ? '输入关键词…'
            : (validation ??
              (pending
                ? '正在搜索…'
                : (error ??
                  (items.length
                    ? `已显示 ${items.length} 条结果 · 按发布时间排序`
                    : '没有找到相关文章，试试更短的关键词'))))}
      </div>
      <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pb-5">
        {pending && !items.length && (
          <div aria-hidden="true" className="space-y-6 py-2">
            {[0, 1, 2].map((key) => (
              <div key={key} className="space-y-3">
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="h-5 w-3/4 rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
              </div>
            ))}
          </div>
        )}
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="py-4">
              <p className="mb-2 text-xs text-muted-foreground">
                {sources.find((source) => source.id === item.source)?.shortName ?? item.source}
                {item.published_at && (
                  <>
                    {' '}
                    ·{' '}
                    <time dateTime={item.published_at}>
                      {new Date(item.published_at).toLocaleDateString('zh-CN')}
                    </time>
                  </>
                )}
              </p>
              <Link
                href={
                  item.section === 'news'
                    ? createNewsArticlePath(item.source, item.title, item.id)
                    : `/out?url=${encodeURIComponent(item.url)}&from=${encodeURIComponent(`/${item.section}`)}`
                }
                className="block rounded-sm text-foreground outline-offset-4 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
              >
                <span className="text-base font-semibold leading-7">
                  <Highlight text={item.title} query={query} />{' '}
                  <ArrowUpRight className="inline size-3.5" aria-hidden="true" />
                </span>
                {item.summary && (
                  <p className="mt-2 text-pretty text-sm leading-6 text-muted-foreground">
                    <Highlight text={item.summary} query={query} />
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
        {error && !pending && (
          <ActionButton
            variant="outline"
            onPress={() => {
              if (data && hasNextPage) void fetchNextPage({ cancelRefetch: false })
              else void refetch()
            }}
          >
            重试
          </ActionButton>
        )}
        {ready && hasNextPage && !error && (
          <ActionButton
            className="mt-3 w-full"
            variant="outline"
            isDisabled={pending}
            onPress={() => void fetchNextPage({ cancelRefetch: false })}
          >
            {pending ? '正在加载…' : '显示更多'}
          </ActionButton>
        )}
      </div>
      <div className="mt-auto border-t border-border px-5 py-3 text-xs text-muted-foreground">
        Tab 切换 · Enter 打开 · Esc 关闭
      </div>
    </>
  )
}

export function ArticleSearch() {
  return (
    <DialogTrigger>
      <ActionButton
        variant="ghost"
        aria-label="搜索文章"
        className="gap-2 text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Search aria-hidden="true" />
        <span className="hidden sm:inline">搜索文章</span>
      </ActionButton>
      <ModalOverlay
        isDismissable
        className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/30 px-3 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:pt-20"
      >
        <Modal className="w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-background text-foreground shadow-lg">
          <Dialog className="flex max-h-[calc(var(--visual-viewport-height,100dvh)-7rem)] flex-col outline-none [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-primary">
            <SearchPanel />
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  )
}
