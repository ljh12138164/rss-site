'use client'

import { hc } from 'hono/client'
import { Languages, LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { pairBilingualBlocks } from '../lib/article-bilingual'
import type { AppType } from '../lib/hono-app'
import { estimateReadingMinutes } from '../lib/reading-progress'
import { cn } from '../lib/utils'
import { ActionButton } from './action-button'
import { ArticleHtmlBody } from './article-html-body'
import { ArticleReadingTools } from './article-reading-tools'

const api = hc<AppType>('/')

interface Translation {
  title: string
  contentHtml: string | null
  summary: string | null
}

export type ReadingMode = 'original' | 'bilingual' | 'chinese'

interface ArticleTranslationProps {
  articleId: string
  source: string
  title: string
  contentHtml: string
  summary: string | null
  canTranslate: boolean
  sourceLabel: ReactNode
  metadata: ReactNode
  summaryControl?: ReactNode
}

export function ArticleTranslation({
  articleId,
  source,
  title,
  contentHtml,
  summary,
  canTranslate,
  sourceLabel,
  metadata,
  summaryControl
}: ArticleTranslationProps) {
  const [translation, setTranslation] = useState<Translation | null>(null)
  const [mode, setMode] = useState<ReadingMode>('original')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const hasBody = Boolean(contentHtml?.replace(/<[^>]*>/g, '').trim())

  async function requestTranslation() {
    if (translation) {
      setMode((current) => (current === 'original' ? 'bilingual' : 'original'))
      return
    }

    setIsLoading(true)
    setError('')
    try {
      const response = await api.api.articles.translate.$post(
        {
          json: { id: articleId, source }
        },
        {
          init: { signal: AbortSignal.timeout(300_000) }
        }
      )
      const payload = await response.json()
      if (!response.ok || !('translation' in payload)) {
        throw new Error('error' in payload ? payload.error : '暂时无法翻译，请稍后重试')
      }
      setTranslation(payload.translation)
      setMode('bilingual')
    } catch (requestError) {
      setError(
        requestError instanceof DOMException && requestError.name === 'TimeoutError'
          ? '本地模型下载或翻译超时，请稍后重试'
          : requestError instanceof Error
            ? requestError.message
            : '暂时无法翻译，请稍后重试'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Derived display titles
  const isBilingual = mode === 'bilingual' && Boolean(translation)
  const isChinese = mode === 'chinese' && Boolean(translation)

  const displayedTitle = isChinese && translation ? translation.title : title

  return (
    <>
      <header className="border-b border-border pb-7 sm:pb-9">
        {sourceLabel}
        <h1 className="headline-display text-pretty text-3xl leading-[1.25] sm:text-[2.5rem] sm:leading-[1.2]">
          {displayedTitle}
        </h1>
        {isBilingual && translation && (
          <p className="mt-3 text-pretty text-xl font-medium text-muted-foreground/90 sm:text-2xl">
            {translation.title}
          </p>
        )}
        {metadata}
        {canTranslate && (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {translation ? (
              <fieldset
                aria-label="双语阅读模式选择"
                className="m-0 inline-flex rounded-lg border border-border bg-muted/40 p-1 text-xs font-medium"
              >
                <button
                  type="button"
                  aria-pressed={mode === 'bilingual'}
                  className={cn(
                    'cursor-pointer rounded-md px-3 py-1.5 transition-colors',
                    mode === 'bilingual'
                      ? 'bg-background font-semibold text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setMode('bilingual')}
                >
                  双语对照
                </button>
                <button
                  type="button"
                  aria-pressed={mode === 'chinese'}
                  className={cn(
                    'cursor-pointer rounded-md px-3 py-1.5 transition-colors',
                    mode === 'chinese'
                      ? 'bg-background font-semibold text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setMode('chinese')}
                >
                  仅译文
                </button>
                <button
                  type="button"
                  aria-pressed={mode === 'original'}
                  className={cn(
                    'cursor-pointer rounded-md px-3 py-1.5 transition-colors',
                    mode === 'original'
                      ? 'bg-background font-semibold text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setMode('original')}
                >
                  仅原文
                </button>
              </fieldset>
            ) : (
              <ActionButton variant="primary" onPress={requestTranslation} isDisabled={isLoading}>
                {isLoading ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Languages className="size-4" aria-hidden="true" />
                )}
                {isLoading ? '正在翻译中…' : '翻译为中文'}
              </ActionButton>
            )}
          </div>
        )}
        {error && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </header>
      {summaryControl}
      <ArticleReadingTools
        articleId={articleId}
        contentKey={mode}
        minutes={estimateReadingMinutes(contentHtml || summary || '')}
      >
        <section aria-label={hasBody ? '文章内容' : '文章摘要'} className="py-8 sm:py-10">
          {isBilingual && translation ? (
            hasBody ? (
              <div className="bilingual-article space-y-6">
                {pairBilingualBlocks(contentHtml, translation.contentHtml ?? '').map((pair) => (
                  <div key={pair.id} className="bilingual-pair group">
                    {pair.original && (
                      <ArticleHtmlBody
                        html={pair.original}
                        className="article-content text-foreground font-serif leading-relaxed"
                      />
                    )}
                    {pair.translated && (
                      <ArticleHtmlBody
                        html={pair.translated}
                        className="article-content mt-2.5 rounded-r-md border-l-2 border-primary/40 bg-accent/20 py-2 pl-3.5 pr-2 font-sans text-[0.95em] leading-relaxed text-muted-foreground transition-colors group-hover:border-primary group-hover:text-foreground"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bilingual-summary space-y-4">
                {summary && (
                  <div className="rounded-lg border border-border bg-card p-4 sm:p-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Original Summary
                    </p>
                    <p className="whitespace-pre-line text-sm leading-7 text-foreground/90">
                      {summary}
                    </p>
                  </div>
                )}
                {translation.summary && (
                  <div className="rounded-lg border border-primary/30 bg-accent/20 p-4 sm:p-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
                      中文摘要
                    </p>
                    <p className="whitespace-pre-line text-sm leading-7 text-foreground">
                      {translation.summary}
                    </p>
                  </div>
                )}
              </div>
            )
          ) : isChinese && translation ? (
            translation.contentHtml ? (
              <ArticleHtmlBody html={translation.contentHtml} />
            ) : translation.summary ? (
              <div className="article-content">
                <p className="mb-5 text-sm text-muted-foreground">文章摘要</p>
                <p className="whitespace-pre-line">{translation.summary}</p>
              </div>
            ) : (
              <p className="text-base leading-8 text-muted-foreground">
                来源暂未提供可在站内阅读的内容，可以前往原文查看。
              </p>
            )
          ) : hasBody && contentHtml ? (
            <ArticleHtmlBody html={contentHtml} />
          ) : summary ? (
            <div className="article-content">
              <p className="mb-5 text-sm text-muted-foreground">文章摘要</p>
              <p className="whitespace-pre-line">{summary}</p>
            </div>
          ) : (
            <p className="text-base leading-8 text-muted-foreground">
              来源暂未提供可在站内阅读的内容，可以前往原文查看。
            </p>
          )}
        </section>
      </ArticleReadingTools>
    </>
  )
}
