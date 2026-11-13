'use client'

import { hc } from 'hono/client'
import { Languages, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import type { AppType } from '../lib/hono-app'
import { ActionButton } from './action-button'
import { UiSegmentedGroup } from './ui/segmented-group'

const api = hc<AppType>('/')

interface Translation {
  title: string
  summary: string
}

export type EventReadingMode = 'original' | 'bilingual' | 'chinese'

interface EventTranslationProps {
  slug: string
  title: string
  summary: string
  canTranslate: boolean
  dateTime: string
  dateLabel: string
}

export function EventTranslation({
  slug,
  title,
  summary,
  canTranslate,
  dateTime,
  dateLabel
}: EventTranslationProps) {
  const [translation, setTranslation] = useState<Translation | null>(null)
  const [mode, setMode] = useState<EventReadingMode>('original')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function requestTranslation() {
    if (translation) {
      setMode((current) => (current === 'original' ? 'bilingual' : 'original'))
      return
    }

    setIsLoading(true)
    setError('')
    try {
      const response = await api.api.events.translate.$post(
        { json: { slug } },
        { init: { signal: AbortSignal.timeout(300_000) } }
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
          ? '翻译超时，请稍后重试'
          : requestError instanceof Error
            ? requestError.message
            : '暂时无法翻译，请稍后重试'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const isBilingual = mode === 'bilingual' && Boolean(translation)
  const isChinese = mode === 'chinese' && Boolean(translation)

  const displayedTitle = isChinese && translation ? translation.title : title

  return (
    <>
      <time className="text-sm tabular-nums text-muted-foreground" dateTime={dateTime}>
        {dateLabel}
      </time>
      <h1 className="mt-4 text-3xl font-semibold leading-tight text-balance sm:text-5xl">
        {displayedTitle}
      </h1>
      {isBilingual && translation && (
        <p className="mt-3 text-pretty text-2xl font-medium text-muted-foreground/90 sm:text-3xl">
          {translation.title}
        </p>
      )}
      {canTranslate && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {translation ? (
            <UiSegmentedGroup
              ariaLabel="阅读模式"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'bilingual', label: '双语对照' },
                { value: 'chinese', label: '仅译文' },
                { value: 'original', label: '仅原文' }
              ]}
            />
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
      {isBilingual && translation ? (
        <div className="mt-8 space-y-4">
          <div className="rounded-sm border border-border bg-card p-4 sm:p-5">
            <p className="mb-2 font-mono text-xs font-semibold text-muted-foreground">原文</p>
            <p className="whitespace-pre-line text-pretty text-base leading-8 text-foreground/90">
              {summary}
            </p>
          </div>
          <div className="rounded-sm border border-primary/40 bg-accent/40 p-4 sm:p-5">
            <p className="mb-2 font-mono text-xs font-semibold text-primary">译文</p>
            <p className="whitespace-pre-line text-pretty text-base leading-8 text-foreground">
              {translation.summary}
            </p>
          </div>
        </div>
      ) : isChinese && translation ? (
        <p className="mt-8 whitespace-pre-line text-pretty text-base leading-8">
          {translation.summary}
        </p>
      ) : (
        <p className="mt-8 whitespace-pre-line text-pretty text-base leading-8">{summary}</p>
      )}
    </>
  )
}
