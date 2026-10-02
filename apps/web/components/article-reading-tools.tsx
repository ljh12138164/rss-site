'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'
import { getReadingPosition, saveReadingPosition } from '../lib/reading-progress'
import { cn } from '../lib/utils'
import { ActionButton } from './action-button'

interface Heading {
  id: string
  title: string
  level: number
}

export function ArticleReadingTools({
  articleId,
  contentKey,
  minutes,
  children
}: {
  articleId: string
  contentKey: string
  minutes: number | null
  children: ReactNode
}) {
  const body = useRef<HTMLDivElement>(null)
  const [headings, setHeadings] = useState<Heading[]>([])
  const [resume, setResume] = useState<number | null>(null)
  const [error, setError] = useState('')

  // biome-ignore lint/correctness/useExhaustiveDependencies: contentKey changes when the rendered reading mode changes.
  useEffect(() => {
    const element = body.current
    if (!element) return
    setHeadings(
      Array.from(element.querySelectorAll<HTMLHeadingElement>('h2,h3,h4,h5,h6'))
        .filter((heading) => {
          const pair = heading.closest('.bilingual-pair')
          return !pair || heading.closest('.article-content') === pair.firstElementChild
        })
        .map((heading, index) => {
          heading.id = `reader-${articleId}-heading-${index + 1}`
          heading.style.scrollMarginTop = '10rem'
          return {
            id: heading.id,
            title: heading.textContent?.trim() ?? '',
            level: Number(heading.tagName.slice(1))
          }
        })
        .filter((heading) => heading.title)
    )
    setResume(getReadingPosition(articleId))
    let latest: number | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    const persist = () => {
      if (latest !== null && !saveReadingPosition(articleId, latest))
        setError('无法保存阅读位置，请检查浏览器本地存储设置。')
    }
    const onScroll = () => {
      const top = element.getBoundingClientRect().top + window.scrollY
      const distance = element.offsetHeight - window.innerHeight
      if (distance <= 0 || window.scrollY < top) return
      latest = Math.max(0, Math.min(1, (window.scrollY - top) / distance))
      if (timer === undefined)
        timer = setTimeout(() => {
          timer = undefined
          persist()
        }, 1000)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pagehide', persist)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', persist)
      if (latest !== null) saveReadingPosition(articleId, latest)
    }
  }, [articleId, contentKey])

  function continueReading() {
    const element = body.current
    if (!element || resume === null) return
    const top = element.getBoundingClientRect().top + window.scrollY
    window.scrollTo({
      top: top + Math.max(0, element.offsetHeight - window.innerHeight) * resume,
      behavior: 'instant'
    })
    setResume(null)
  }

  return (
    <>
      {(minutes !== null || resume !== null) && (
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {minutes !== null && <p className="tabular-nums">预计阅读 {minutes} 分钟</p>}
          {resume !== null && (
            <ActionButton variant="outline" onPress={continueReading}>
              继续上次阅读 · {Math.round(resume * 100)}%
            </ActionButton>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {headings.length > 1 && (
        <details className="mt-4 rounded-lg border border-border p-4">
          <summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-primary">
            文章目录 · <span className="tabular-nums">{headings.length}</span> 节
          </summary>
          <nav aria-label="文章目录" className="mt-3">
            <ol className="space-y-1">
              {headings.map((heading) => (
                <li key={heading.id} className={cn(heading.level > 2 && 'pl-4')}>
                  <a
                    href={`#${heading.id}`}
                    title={heading.title}
                    className="block min-h-11 truncate py-3 text-sm text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    {heading.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </details>
      )}
      <div ref={body}>{children}</div>
    </>
  )
}
