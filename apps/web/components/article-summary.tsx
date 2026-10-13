'use client'

import { hc } from 'hono/client'
import { ListCollapse } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { readLocalSummary, writeLocalSummary } from '../lib/article-summary-cache'
import { isArticleSummary, type ArticleSummary as Summary } from '../lib/article-summary-result'
import type { AppType } from '../lib/hono-app'
import { ActionButton } from './action-button'

const api = hc<AppType>('/')

export function ArticleSummary({
  articleId,
  source,
  cacheKey
}: {
  articleId: string
  source: string
  cacheKey: string
}) {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(true)
  const restoration = useRef<Promise<Summary | null> | null>(null)

  useEffect(() => {
    let active = true
    restoration.current = readLocalSummary(cacheKey)
    void restoration.current.then((cached) => {
      if (active && cached) setSummary(cached)
    })
    return () => {
      active = false
    }
  }, [cacheKey])

  async function summarize() {
    if (pending) return
    if (summary) {
      setVisible(!visible)
      return
    }
    setPending(true)
    setError('')
    try {
      const cached = await (restoration.current ?? readLocalSummary(cacheKey))
      if (cached) {
        setSummary(cached)
        setVisible(true)
        return
      }
      const response = await api.api.articles.summarize.$post(
        { json: { id: articleId, source } },
        { init: { signal: AbortSignal.timeout(130_000) } }
      )
      const payload = await response.json()
      if (!response.ok || !('summary' in payload) || !isArticleSummary(payload.summary))
        throw new Error('error' in payload ? payload.error : '暂时无法生成总结，请稍后重试')
      setSummary(payload.summary)
      setVisible(true)
      void writeLocalSummary(cacheKey, payload.summary)
    } catch (failure) {
      setError(
        failure instanceof Error && failure.name === 'TimeoutError'
          ? '生成总结超时，请稍后重试'
          : failure instanceof Error
            ? failure.message
            : '暂时无法生成总结，请稍后重试'
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <section aria-label="AI 总结" className="mt-6">
      <ActionButton variant="outline" isDisabled={pending} onPress={summarize}>
        <ListCollapse className="size-4 shrink-0" aria-hidden="true" />
        {pending
          ? '正在生成总结'
          : summary
            ? visible
              ? '收起 AI 总结'
              : '展开 AI 总结'
            : error
              ? '重试 AI 总结'
              : 'AI 总结'}
      </ActionButton>
      <div aria-live="polite" aria-busy={pending}>
        {pending && (
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-pretty text-sm text-muted-foreground">正在提取文章要点，请稍候…</p>
            <div aria-hidden="true" className="mt-4 space-y-2">
              <div className="h-3 w-full rounded-sm bg-muted" />
              <div className="h-3 w-5/6 rounded-sm bg-muted" />
              <div className="h-3 w-2/3 rounded-sm bg-muted" />
            </div>
          </div>
        )}
        {error && (
          <p role="alert" className="mt-3 text-pretty text-sm leading-6 text-destructive">
            {error}
          </p>
        )}
        {summary && visible && (
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 sm:p-5">
            <h2 className="text-balance text-base font-semibold">文章要点</h2>
            <p className="mt-3 break-words text-pretty text-sm leading-7">{summary.overview}</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7">
              {summary.keyPoints.map((point) => (
                <li className="break-words text-pretty" key={point}>
                  {point}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-pretty text-xs leading-5 text-muted-foreground">
              {summary.basis === 'excerpt'
                ? '基于来源摘要整理，未获取全文。'
                : '基于站内已有正文整理，内容可能为节选。'}
              完整内容以原文为准。
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
