'use client'

import { hc } from 'hono/client'
import { Languages, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import type { AppType } from '../lib/hono-app'
import { ActionButton } from './action-button'

const api = hc<AppType>('/')

interface Translation {
  title: string
  summary: string
}

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
  const [showTranslation, setShowTranslation] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const displayedTitle = showTranslation && translation ? translation.title : title
  const displayedSummary = showTranslation && translation ? translation.summary : summary

  async function requestTranslation() {
    if (translation) {
      setShowTranslation((value) => !value)
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
      setShowTranslation(true)
    } catch (requestError) {
      setError(
        requestError instanceof DOMException && requestError.name === 'TimeoutError'
          ? '本地翻译超时，请稍后重试'
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
      <time className="text-sm tabular-nums text-muted-foreground" dateTime={dateTime}>
        {dateLabel}
      </time>
      <h1 className="mt-4 text-3xl font-semibold leading-tight text-balance sm:text-5xl">
        {displayedTitle}
      </h1>
      {canTranslate && (
        <div className="mt-5">
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
      <p className="mt-8 whitespace-pre-line text-pretty text-base leading-8">{displayedSummary}</p>
    </>
  )
}
