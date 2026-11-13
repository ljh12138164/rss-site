import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { actionStyles } from '../../components/action-styles'
import { TransitMark } from '../../components/transit-mark'
import {
  type OutboundReturnPath,
  resolveOutboundDestination,
  resolveOutboundReturnPath
} from '../../lib/outbound-link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '即将离开本站',
  description: '确认目标地址后继续访问第三方原文。',
  robots: { index: false, follow: false }
}

function OutboundFrame({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-background px-5 py-12 sm:px-8 sm:py-20">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 text-foreground hover:text-primary"
        >
          <TransitMark className="size-8" />
          <span className="text-xl font-bold tracking-tight">今日热点</span>
        </Link>
        <section className="mt-6 rounded-sm border border-border bg-card px-6 py-8 shadow-sm sm:px-10 sm:py-9">
          {children}
        </section>
      </div>
    </main>
  )
}

function UnavailableNotice({ returnTo }: { returnTo: OutboundReturnPath }) {
  return (
    <OutboundFrame>
      <h1 className="text-xl font-medium tracking-[-0.02em]">链接已停止放行</h1>
      <p className="mt-5 text-sm leading-6 text-muted-foreground">
        目标地址无效或不是可访问的 Web 链接，本站没有继续提供跳转入口。
      </p>
      <div className="mt-8 flex justify-end border-t border-border pt-6">
        <Link className={actionStyles('outline')} href={returnTo}>
          返回热点列表
        </Link>
      </div>
    </OutboundFrame>
  )
}

export function OutboundView({
  destination,
  returnTo = '/technology'
}: {
  destination: string | null
  returnTo?: OutboundReturnPath
}) {
  if (!destination) {
    return <UnavailableNotice returnTo={returnTo} />
  }

  return (
    <OutboundFrame>
      <h1 className="headline-display text-xl sm:text-2xl" id="outbound-title">
        即将离开今日热点，请注意账号财产安全
      </h1>
      <p className="mt-5 break-all text-sm leading-6 text-muted-foreground sm:text-base">
        {destination}
      </p>
      <div className="mt-8 flex justify-end border-t border-border pt-6">
        <a
          className={actionStyles('primary')}
          href={destination}
          rel="noreferrer noopener external"
        >
          继续访问
        </a>
      </div>
    </OutboundFrame>
  )
}

export default async function OutboundPage({
  searchParams
}: {
  searchParams: Promise<{ url?: string | string[]; from?: string | string[] }>
}) {
  const query = await searchParams
  const rawUrl = typeof query.url === 'string' ? query.url : ''
  const destination = resolveOutboundDestination(rawUrl)
  const returnTo = resolveOutboundReturnPath(typeof query.from === 'string' ? query.from : '')

  return <OutboundView destination={destination} returnTo={returnTo} />
}
