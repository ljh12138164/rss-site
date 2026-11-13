'use client'

import { ActionButton } from '../components/action-button'

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[42rem] items-center px-5 sm:px-7">
      <div className="w-full rounded-sm border border-border bg-card p-6 sm:p-8">
        <span className="inline-flex items-center rounded-sm bg-destructive/14 px-2 py-0.5 font-mono text-xs font-semibold text-destructive">
          加载异常
        </span>
        <h1 className="headline-display mt-4 text-3xl sm:text-4xl">页面加载失败</h1>
        <p className="mt-2.5 text-sm leading-6 text-muted-foreground">请稍后重试或刷新页面。</p>
        <ActionButton className="mt-6" onPress={reset} variant="primary">
          重新加载
        </ActionButton>
      </div>
    </main>
  )
}
