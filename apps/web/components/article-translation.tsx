'use client'

import { hc } from 'hono/client'
import { Languages, LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import type { AppType } from '../lib/hono-app'
import { ActionButton } from './action-button'

const api = hc<AppType>('/')

interface Translation {
  title: string
  contentHtml: string | null
  summary: string | null
}

interface ArticleTranslationProps {
  articleId: string
  source: string
  title: string
  contentHtml: string
  summary: string | null
  canTranslate: boolean
  sourceLabel: ReactNode
  metadata: ReactNode
}

export function ArticleTranslation({
  articleId,
  source,
  title,
  contentHtml,
  summary,
  canTranslate,
  sourceLabel,
  metadata
}: ArticleTranslationProps) {
  const [translation, setTranslation] = useState<Translation | null>(null)
  const [showTranslation, setShowTranslation] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const displayedTitle = showTranslation && translation ? translation.title : title
  const displayedHtml = showTranslation && translation ? translation.contentHtml : contentHtml
  const displayedSummary = showTranslation && translation ? translation.summary : summary
  const hasBody = Boolean(displayedHtml?.replace(/<[^>]*>/g, '').trim())

  async function requestTranslation() {
    if (translation) {
      setShowTranslation((value) => !value)
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
      setShowTranslation(true)
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

  return (
    <>
      <header className="border-b border-border pb-7 sm:pb-9">
        {sourceLabel}
        <h1 className="headline-display text-pretty text-3xl leading-[1.25] sm:text-[2.5rem] sm:leading-[1.2]">
          {displayedTitle}
        </h1>
        {metadata}
        {canTranslate && (
          <div className="mt-4">
            <ActionButton
              variant={translation ? 'outline' : 'primary'}
              onPress={requestTranslation}
              isDisabled={isLoading}
            >
              {isLoading ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Languages className="size-4" aria-hidden="true" />
              )}
              {isLoading
                ? '正在翻译中'
                : showTranslation
                  ? '查看英文原文'
                  : translation
                    ? '查看中文译文'
                    : '翻译为中文'}
            </ActionButton>
          </div>
        )}
        {error && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </header>
      <section aria-label={hasBody ? '文章内容' : '文章摘要'} className="py-8 sm:py-10">
        {hasBody && displayedHtml ? (
          // biome-ignore lint/security/noDangerouslySetInnerHtml: both original and translated HTML pass the server allowlist.
          <div className="article-content" dangerouslySetInnerHTML={{ __html: displayedHtml }} />
        ) : displayedSummary ? (
          <div className="article-content">
            <p className="mb-5 text-sm text-muted-foreground">文章摘要</p>
            <p className="whitespace-pre-line">{displayedSummary}</p>
          </div>
        ) : (
          <p className="text-base leading-8 text-muted-foreground">
            来源暂未提供可在站内阅读的内容，可以前往原文查看。
          </p>
        )}
      </section>
    </>
  )
}
