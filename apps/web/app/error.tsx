'use client'

import Link from 'next/link'
import { ActionButton } from '../components/action-button'
import { actionStyles } from '../components/action-styles'

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div
      role="alert"
      className="mx-auto flex min-h-[60dvh] w-full max-w-[42rem] items-center px-5 py-12 sm:px-7"
    >
      <div className="w-full rounded-sm border border-border bg-card p-6 sm:p-8">
        <span className="inline-flex items-center rounded-sm bg-destructive/14 px-2 py-0.5 font-mono text-xs font-semibold text-destructive">
          加载异常
        </span>
        <h1 className="headline-display mt-4 text-3xl sm:text-4xl">页面加载失败</h1>
        <p className="mt-2.5 text-sm leading-6 text-muted-foreground">请稍后重试或刷新页面。</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ActionButton onPress={reset} variant="primary">
            重新加载
          </ActionButton>
          <Link className={actionStyles('outline')} href="/">
            浏览全部热点
          </Link>
        </div>
      </div>
    </div>
  )
}
