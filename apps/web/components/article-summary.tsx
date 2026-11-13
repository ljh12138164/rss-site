'use client'

import { hc } from 'hono/client'
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { readLocalSummary, writeLocalSummary } from '../lib/article-summary-cache'
import type { ArticleSummary as Summary, SummaryResult } from '../lib/article-summary-result'
import { readSummaryStream } from '../lib/article-summary-stream'
import type { AppType } from '../lib/hono-app'
import { ActionButton } from './action-button'

const api = hc<AppType>('/')

export function ArticleSummary({
  articleId,
  cacheKey,
  kind = 'article'
}: {
  articleId: string
  cacheKey: string
  kind?: 'article' | 'skill'
}) {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [draft, setDraft] = useState<SummaryResult | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(true)
  const restoration = useRef<Promise<Summary | null> | null>(null)
  const request = useRef<AbortController | null>(null)
  const contentId = useId()
  const displayed = summary ?? draft

  useEffect(() => {
    let active = true
    restoration.current = readLocalSummary(cacheKey)
    void restoration.current.then((cached) => {
      if (active && cached) setSummary(cached)
    })
    return () => {
      active = false
      request.current?.abort()
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
    setDraft(null)
    const controller = new AbortController()
    request.current = controller
    try {
      const cached = await (restoration.current ?? readLocalSummary(cacheKey))
      controller.signal.throwIfAborted()
      if (cached) {
        setSummary(cached)
        setVisible(true)
        return
      }
      const invoke =
        kind === 'skill' ? api.api.skills.summarize.$post : api.api.articles.summarize.$post
      const response = await invoke(
        { json: { id: articleId } },
        {
          init: {
            signal: AbortSignal.any([controller.signal, AbortSignal.timeout(130_000)]),
            headers: { accept: 'application/x-ndjson', 'content-type': 'application/json' }
          }
        }
      )
      const result = await readSummaryStream(response, (partial) => {
        if (!controller.signal.aborted) setDraft(partial)
      })
      controller.signal.throwIfAborted()
      setSummary(result)
      setDraft(null)
      setVisible(true)
      void writeLocalSummary(cacheKey, result)
    } catch (failure) {
      if (controller.signal.aborted) return
      setDraft(null)
      setError(
        failure instanceof Error && failure.name === 'TimeoutError'
          ? '生成总结超时，请稍后重试'
          : failure instanceof Error
            ? failure.message
            : '暂时无法生成总结，请稍后重试'
      )
    } finally {
      if (!controller.signal.aborted) setPending(false)
    }
  }

  return (
    <section
      aria-label="AI 总结"
      className="mt-6 rounded-sm border border-primary/45 bg-card p-4 sm:p-5"
    >
      <div className="flex min-w-0 items-center justify-between gap-3">
        <h2 className="flex min-w-0 items-center gap-2 text-balance font-mono text-sm font-semibold text-primary">
          <Sparkles className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">AI 总结</span>
        </h2>
        <ActionButton
          variant="ghost"
          isDisabled={pending}
          onPress={summarize}
          aria-label={
            pending
              ? '正在生成总结'
              : summary
                ? visible
                  ? '收起 AI 总结'
                  : '展开 AI 总结'
                : error
                  ? '重试 AI 总结'
                  : '生成 AI 总结'
          }
          aria-expanded={summary ? visible : undefined}
          aria-controls={summary ? contentId : undefined}
          className="rounded-sm px-3 text-xs text-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
        >
          {pending
            ? '生成中…'
            : summary
              ? visible
                ? '收起'
                : '展开'
              : error
                ? '重试'
                : '生成总结'}
          {summary &&
            (visible ? (
              <ChevronUp className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
            ))}
        </ActionButton>
      </div>
      <div id={contentId} aria-live="polite" aria-busy={pending}>
        {pending && (
          <div className="mt-3">
            <p className="text-pretty text-sm text-muted-foreground">正在提炼要点…</p>
            {!draft && (
              <div aria-hidden="true" className="mt-3 space-y-2">
                <div className="h-3 w-full rounded-sm bg-muted" />
                <div className="h-3 w-5/6 rounded-sm bg-muted" />
                <div className="h-3 w-2/3 rounded-sm bg-muted" />
              </div>
            )}
          </div>
        )}
        {error && (
          <p role="alert" className="mt-3 text-pretty text-sm leading-6 text-destructive">
            {error}
          </p>
        )}
        {displayed && visible && (
          <div className="mt-3">
            <p className="break-words text-pretty text-sm leading-7">{displayed.overview}</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7">
              {displayed.keyPoints.map((point) => (
                <li className="break-words text-pretty" key={point}>
                  {point}
                </li>
              ))}
            </ul>
            {summary && (
              <p className="mt-3 text-pretty font-mono text-xs leading-5 text-muted-foreground">
                {kind === 'skill'
                  ? '基于 SKILL.md 提炼'
                  : summary.basis === 'excerpt'
                    ? '基于来源摘要提炼'
                    : '基于正文提炼'}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
