'use client'

import { Bookmark, BookmarkCheck } from 'lucide-react'
import type { MouseEvent } from 'react'
import { useReadingList } from '../lib/reading-list'
import { cn } from '../lib/utils'

export function ArticleBookmarkButton({
  id,
  title,
  url,
  source,
  sourceName,
  section,
  variant = 'button',
  className
}: {
  id: string
  title: string
  url: string
  source?: string
  sourceName?: string
  section?: string
  variant?: 'button' | 'icon'
  className?: string
}) {
  const { isSaved, toggleSave } = useReadingList()
  const saved = isSaved(id)

  const handleToggle = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleSave({ id, title, url, source, sourceName, section })
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'inline-flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors',
          saved
            ? 'text-primary hover:text-primary/80'
            : 'text-muted-foreground/60 hover:text-foreground',
          className
        )}
        title={saved ? '移出稍后读' : '加入稍后读'}
        aria-label={saved ? '移出稍后读' : '加入稍后读'}
      >
        {saved ? (
          <BookmarkCheck className="size-4 text-primary" aria-hidden="true" />
        ) : (
          <Bookmark className="size-4" aria-hidden="true" />
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={cn(
        'inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
        saved
          ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
          : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
        className
      )}
      aria-label={saved ? '移出稍后读' : '加入稍后读'}
    >
      {saved ? (
        <BookmarkCheck className="size-3.5" aria-hidden="true" />
      ) : (
        <Bookmark className="size-3.5" aria-hidden="true" />
      )}
      <span>{saved ? '已加入稍后读' : '稍后阅读'}</span>
    </button>
  )
}
