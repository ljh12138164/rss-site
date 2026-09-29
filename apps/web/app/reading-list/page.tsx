'use client'

import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  Clock,
  History,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { SiteShell } from '../../components/site-shell'
import {
  type ReadingHistoryItem,
  type SavedArticleItem,
  useReadingList
} from '../../lib/reading-list'
import { cn } from '../../lib/utils'

const timeFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Asia/Shanghai'
})

export default function ReadingListPage() {
  const [activeTab, setActiveTab] = useState<'saved' | 'history'>('saved')
  const {
    savedArticles,
    readingHistory,
    isSaved,
    toggleSave,
    removeSavedArticle,
    clearSavedArticles,
    removeReadingHistory,
    clearReadingHistory
  } = useReadingList()

  const [confirmClear, setConfirmClear] = useState(false)

  const handleClearAll = () => {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    if (activeTab === 'saved') {
      clearSavedArticles()
    } else {
      clearReadingHistory()
    }
    setConfirmClear(false)
  }

  return (
    <SiteShell mainClassName="mx-auto w-full max-w-4xl py-8 sm:py-12">
      <header className="mb-8 border-b border-border pb-7 sm:mb-10">
        <h1 className="headline-display text-3xl sm:text-4xl">稍后读与阅读足迹</h1>
        <p className="mt-3 text-pretty text-sm leading-7 text-muted-foreground">
          零后端数据库开销，基于本地浏览器安全离线存储。随时收藏深度热点并追溯阅读历史。
        </p>

        {/* Tab switch */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div
            role="tablist"
            aria-label="阅读列表分类"
            className="inline-flex rounded-lg border border-border bg-muted/40 p-1 text-xs font-medium"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'saved'}
              className={cn(
                'cursor-pointer rounded-md px-4 py-2 transition-colors flex items-center gap-2',
                activeTab === 'saved'
                  ? 'bg-background font-semibold text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => {
                setActiveTab('saved')
                setConfirmClear(false)
              }}
            >
              <Bookmark className="size-3.5" aria-hidden="true" />
              <span>稍后阅读</span>
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                {savedArticles.length}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'history'}
              className={cn(
                'cursor-pointer rounded-md px-4 py-2 transition-colors flex items-center gap-2',
                activeTab === 'history'
                  ? 'bg-background font-semibold text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => {
                setActiveTab('history')
                setConfirmClear(false)
              }}
            >
              <History className="size-3.5" aria-hidden="true" />
              <span>历史足迹</span>
              <span className="rounded-full bg-muted-foreground/15 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {readingHistory.length}
              </span>
            </button>
          </div>

          {((activeTab === 'saved' && savedArticles.length > 0) ||
            (activeTab === 'history' && readingHistory.length > 0)) && (
            <button
              type="button"
              onClick={handleClearAll}
              className={cn(
                'cursor-pointer text-xs font-medium transition-colors',
                confirmClear
                  ? 'text-destructive font-semibold'
                  : 'text-muted-foreground hover:text-destructive'
              )}
            >
              {confirmClear
                ? '确定清空全部吗？'
                : activeTab === 'saved'
                  ? '清空稍后读'
                  : '清空足迹'}
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>
        {activeTab === 'saved' ? (
          savedArticles.length === 0 ? (
            <EmptyState
              icon={<Bookmark className="size-10 text-muted-foreground/40" />}
              title="暂无稍后阅读文章"
              description="在浏览热点或阅读详情页时，点击「稍后阅读」按钮即可将文章收藏到此处，便于稍后沉浸研读。"
            />
          ) : (
            <ol className="divide-y divide-border border-y border-border">
              {savedArticles.map((item) => (
                <SavedItemRow
                  key={item.id}
                  item={item}
                  onRemove={() => removeSavedArticle(item.id)}
                />
              ))}
            </ol>
          )
        ) : readingHistory.length === 0 ? (
          <EmptyState
            icon={<History className="size-10 text-muted-foreground/40" />}
            title="暂无阅读足迹"
            description="当您在站内打开并阅读任意文章后，系统将自动在本地记录您的阅读足迹，最多保存最近 100 条。"
          />
        ) : (
          <ol className="divide-y divide-border border-y border-border">
            {readingHistory.map((item) => (
              <HistoryItemRow
                key={item.id}
                item={item}
                isSaved={isSaved(item.id)}
                onToggleSave={() =>
                  toggleSave({
                    id: item.id,
                    title: item.title,
                    url: item.url,
                    source: item.source,
                    sourceName: item.sourceName,
                    section: item.section
                  })
                }
                onRemove={() => removeReadingHistory(item.id)}
              />
            ))}
          </ol>
        )}
      </main>
    </SiteShell>
  )
}

function EmptyState({
  icon,
  title,
  description
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center sm:py-24">
      <div className="mb-4">{icon}</div>
      <h2 className="headline-display text-lg sm:text-xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">{description}</p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
      >
        <span>返回首页浏览热点</span>
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </Link>
    </div>
  )
}

function SavedItemRow({ item, onRemove }: { item: SavedArticleItem; onRemove: () => void }) {
  const isInternal = item.url.startsWith('/')

  return (
    <li className="-mx-2 flex flex-col gap-2 rounded-md p-3 transition-colors hover:bg-row-highlight sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          {item.sourceName && <span className="font-semibold text-primary">{item.sourceName}</span>}
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" aria-hidden="true" />
            <time dateTime={new Date(item.savedAt).toISOString()}>
              {timeFormatter.format(item.savedAt)}
            </time>
          </span>
        </div>
        <Link
          href={item.url}
          className="group inline-flex items-baseline gap-1.5 text-base font-medium text-foreground transition-colors hover:text-primary sm:text-[1.0625rem]"
        >
          <span className="min-w-0 wrap-anywhere">{item.title}</span>
          {isInternal ? (
            <ArrowRight className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary" />
          ) : (
            <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
          )}
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-2 pt-1 sm:pt-0">
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
          title="从稍后读移除"
          aria-label="从稍后读移除"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}

function HistoryItemRow({
  item,
  isSaved,
  onToggleSave,
  onRemove
}: {
  item: ReadingHistoryItem
  isSaved: boolean
  onToggleSave: () => void
  onRemove: () => void
}) {
  const isInternal = item.url.startsWith('/')

  return (
    <li className="-mx-2 flex flex-col gap-2 rounded-md p-3 transition-colors hover:bg-row-highlight sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          {item.sourceName && <span className="font-semibold text-primary">{item.sourceName}</span>}
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" aria-hidden="true" />
            <time dateTime={new Date(item.readAt).toISOString()}>
              {timeFormatter.format(item.readAt)}
            </time>
          </span>
        </div>
        <Link
          href={item.url}
          className="group inline-flex items-baseline gap-1.5 text-base font-medium text-foreground transition-colors hover:text-primary sm:text-[1.0625rem]"
        >
          <span className="min-w-0 wrap-anywhere">{item.title}</span>
          {isInternal ? (
            <ArrowRight className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary" />
          ) : (
            <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
          )}
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-2 pt-1 sm:pt-0">
        <button
          type="button"
          onClick={onToggleSave}
          className={cn(
            'inline-flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors',
            isSaved
              ? 'text-primary hover:text-primary/80'
              : 'text-muted-foreground/60 hover:text-foreground'
          )}
          title={isSaved ? '移出稍后读' : '加入稍后读'}
          aria-label={isSaved ? '移出稍后读' : '加入稍后读'}
        >
          {isSaved ? (
            <BookmarkCheck className="size-4" aria-hidden="true" />
          ) : (
            <Bookmark className="size-4" aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
          title="删除此足迹"
          aria-label="删除此足迹"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}
