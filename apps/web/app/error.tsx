'use client'

import { ActionButton } from '../components/action-button'

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[45rem] items-center px-5 sm:px-7">
      <div className="w-full border-y border-border py-16">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">Signal lost</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">页面暂时走神了</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">可以重新建立连接，再试一次。</p>
        <ActionButton className="mt-7" onPress={reset} variant="outline">
          重新加载
        </ActionButton>
      </div>
    </main>
  )
}
