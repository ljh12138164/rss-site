'use client'

import { ArrowUpRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ZhihuQaContent } from '../lib/zhihu-qa'
import { ArticleHtmlBody } from './article-html-body'

export interface ZhihuQaBodyProps {
  qa: ZhihuQaContent
  lang?: string
}

export function ZhihuQaBody({ qa, lang = 'zh-CN' }: ZhihuQaBodyProps) {
  const t = useTranslations('article')

  return (
    <div className="space-y-8">
      {qa.questionContextHtml && (
        <section
          aria-label={t('zhihuQuestionContext')}
          className="rounded-sm border border-border bg-card/70 px-5 py-4 sm:px-6 sm:py-5"
        >
          <p className="mb-2 font-mono text-xs font-semibold text-muted-foreground">
            {t('zhihuQuestionContext')}
          </p>
          <ArticleHtmlBody
            html={qa.questionContextHtml}
            lang={lang}
            className="article-content zhihu-qa-context text-sm text-foreground/90 sm:text-[0.96875rem]"
          />
        </section>
      )}
      <section aria-label={t('zhihuTopAnswers')}>
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
          <p className="font-mono text-xs font-semibold text-muted-foreground">
            {t('zhihuTopAnswers')}
          </p>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {t('zhihuAnswerCount', { count: qa.answers.length })}
          </span>
        </div>
        <ol className="divide-y divide-border">
          {qa.answers.map((answer, index) => (
            <li key={answer.id} className="py-7 first:pt-6 last:pb-2">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="shrink-0 font-mono text-xs font-medium text-muted-foreground tabular-nums"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h2
                    className="min-w-0 truncate text-lg font-semibold leading-snug text-foreground sm:text-xl"
                    title={answer.author}
                  >
                    {answer.author}
                  </h2>
                  {answer.voteupCount > 0 && (
                    <span className="shrink-0 rounded-sm border border-primary/25 bg-primary/8 px-2 py-0.5 font-mono text-xs font-medium text-primary tabular-nums">
                      {t('zhihuUpvotes', { count: answer.voteupCount })}
                    </span>
                  )}
                </div>
                <a
                  href={answer.url}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  data-outbound="true"
                  className="group inline-flex min-h-11 shrink-0 items-center gap-1 font-mono text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  <span>{t('zhihuViewAnswer')}</span>
                  <ArrowUpRight
                    className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </a>
              </div>
              <ArticleHtmlBody
                html={answer.bodyHtml}
                lang={lang}
                className="article-content zhihu-qa-answer-body"
              />
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
