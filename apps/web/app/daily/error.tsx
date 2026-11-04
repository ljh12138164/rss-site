'use client'

import Link from 'next/link'
import { SiteShell } from '../../components/site-shell'

export default function DailyError({ reset }: { reset: () => void }) {
  return (
    <SiteShell>
      <div className="mx-auto max-w-2xl py-16">
        <h1 className="headline-display text-3xl">暂时无法读取日报</h1>
        <p className="mt-4 text-muted-foreground">请稍后重新加载</p>
        <div className="mt-6 flex flex-wrap gap-6">
          <button
            type="button"
            onClick={reset}
            className="min-h-11 text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary"
          >
            重新加载
          </button>
          <Link href="/daily" className="inline-flex min-h-11 items-center">
            返回最新日报
          </Link>
        </div>
      </div>
    </SiteShell>
  )
}
