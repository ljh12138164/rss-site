'use client'

import { listSignalSections } from '@rss-site/signals'
import { useInfiniteQuery } from '@tanstack/react-query'
import { hc } from 'hono/client'
import { ArrowRight, Search, X } from 'lucide-react'
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
import { createArticlePath } from '../lib/article-route'
import { type SearchArticle, type SearchRange, searchValidation } from '../lib/article-search'
import type { AppType } from '../lib/hono-app'
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
].filter((source) => source.isArticle)
const api = hc<AppType>('/')

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
  const [section, setSection] = useState('')
  const [source, setSource] = useState('')
  const [range, setRange] = useState<SearchRange>('all')
  const [snapshotAt] = useState(() => new Date().toISOString())
  const [request, setRequest] = useState({
    q: '',
    section: '',
    source: '',
    range: 'all' as SearchRange,
    at: ''
  })
  const debouncedQuery = request.q
  const query = value.trim()
  const validation = searchValidation(query)
  useEffect(() => {
    if (validation || composing) return
    const timer = setTimeout(
      () => setRequest({ q: query, section, source, range, at: snapshotAt }),
      300
    )
    return () => clearTimeout(timer)
  }, [query, validation, composing, section, source, range, snapshotAt])
  const ready =
    !validation &&
    !composing &&
    debouncedQuery === query &&
    request.section === section &&
    request.source === source &&
    request.range === range
  const { data, isFetching, isError, hasNextPage, fetchNextPage, refetch } = useInfiniteQuery({
    queryKey: ['article-search', request],
    initialPageParam: 0,
    enabled: ready && !!debouncedQuery,
    staleTime: 300000,
    gcTime: 1800000,
    queryFn: async ({
      pageParam,
      signal
    }): Promise<{ items: SearchArticle[]; hasMore: boolean }> => {
      const response = await api.api.search.$get(
        {
          query: {
            ...request,
            section: request.section || undefined,
            source: request.source || undefined,
            page: String(pageParam)
          }
        },
        { init: { signal, cache: 'no-store' } }
      )
      if (response.status !== 200) throw new Error('Search unavailable')
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
      <div className="mx-5 mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="min-w-0 text-xs text-muted-foreground">
          频道
          <select
            value={section}
            onChange={(event) => {
              setSection(event.target.value)
              setSource('')
            }}
            className="mt-1 min-h-10 w-full rounded-sm border border-input bg-card px-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <option value="">全部频道</option>
            {listSignalSections()
              .filter((entry) => sources.some((item) => item.section === entry.id))
              .map((entry) => (
                <option key={entry.id} value={entry.path}>
                  {entry.title}
                </option>
              ))}
          </select>
        </label>
        <label className="min-w-0 text-xs text-muted-foreground">
          来源
          <select
            value={source}
            onChange={(event) => setSource(event.target.value)}
            className="mt-1 min-h-10 w-full rounded-sm border border-input bg-card px-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <option value="">全部来源</option>
            {sources
              .filter((item) => !section || `/${item.section}` === section)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
        </label>
        <label className="min-w-0 text-xs text-muted-foreground">
          时间
          <select
            value={range}
            onChange={(event) => setRange(event.target.value as SearchRange)}
            className="mt-1 min-h-10 w-full rounded-sm border border-input bg-card px-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <option value="all">不限</option>
            <option value="day">近 24 小时</option>
            <option value="week">近 7 天</option>
          </select>
        </label>
      </div>
      <div
        className="px-5 py-3 text-xs text-muted-foreground tabular-nums"
        role="status"
        aria-live="polite"
      >
        {!query
          ? '按标题和摘要检索'
          : composing
            ? '输入中…'
            : (validation ??
              (pending
                ? '检索中…'
                : (error ??
                  (items.length ? `${items.length} 条匹配 · 按发布时间` : '未找到匹配内容'))))}
      </div>
      <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pb-5">
        {pending && !items.length && (
          <div aria-hidden="true" className="space-y-6 py-2">
            {[0, 1, 2].map((key) => (
              <div key={key} className="space-y-3">
                <div className="h-3 w-24 rounded-sm bg-muted" />
                <div className="h-5 w-3/4 rounded-sm bg-muted" />
                <div className="h-4 w-full rounded-sm bg-muted" />
              </div>
            ))}
          </div>
        )}
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id} className="py-4">
              <p className="mb-1.5 font-mono text-xs text-muted-foreground tabular-nums">
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
                href={createArticlePath(item.source, item.title, item.id)}
                className="block rounded-sm text-foreground outline-offset-4 hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
              >
                <span className="text-base font-semibold leading-6">
                  <Highlight text={item.title} query={query} />{' '}
                  <ArrowRight className="inline size-3.5" aria-hidden="true" />
                </span>
                {item.summary && (
                  <p className="mt-1.5 text-pretty text-sm leading-6 text-muted-foreground">
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
            {pending ? '加载中…' : '更多'}
          </ActionButton>
        )}
      </div>
      <div className="mt-auto border-t border-border px-5 py-2.5 font-mono text-[11px] text-muted-foreground">
        Tab 切换 · Enter 打开 · Esc 关闭
      </div>
    </>
  )
}

export function ArticleSearch({ variant = 'topbar' }: { variant?: 'topbar' | 'icon' }) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      {variant === 'icon' ? (
        <ActionButton
          variant="ghost"
          size="icon"
          aria-label="搜索"
          className="size-9 rounded-sm border border-border bg-card text-muted-foreground hover:border-primary/60 hover:text-foreground"
        >
          <Search aria-hidden="true" className="size-4" />
        </ActionButton>
      ) : (
        <ActionButton
          variant="ghost"
          aria-label="搜索文章"
          className="h-9 w-full max-w-sm justify-between rounded-sm border border-border bg-card px-3 text-sm text-muted-foreground hover:border-primary/60 hover:bg-card hover:text-foreground"
        >
          <span className="flex min-w-0 items-center gap-2 truncate">
            <Search aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate">搜索文章或关键词…</span>
          </span>
          <kbd className="hidden sm:inline-flex shrink-0 items-center rounded-sm border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </ActionButton>
      )}
      <ModalOverlay
        isDismissable
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-3 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xs sm:pt-20"
      >
        <Modal className="w-full max-w-2xl overflow-hidden rounded-sm border border-strong bg-popover text-popover-foreground shadow-2xl">
          <Dialog className="flex max-h-[calc(var(--visual-viewport-height,100dvh)-7rem)] flex-col outline-none [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-ring">
            <SearchPanel />
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  )
}
