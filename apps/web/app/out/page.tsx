import { ArrowLeft, ArrowUpRight, ShieldAlert } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { actionStyles } from '../../components/action-styles'
import { SiteShell } from '../../components/site-shell'
import {
  type OutboundReturnPath,
  resolveOutboundDestination,
  resolveOutboundReturnPath
} from '../../lib/outbound-link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '即将离开本站',
  description: '查看目标站点后继续访问第三方原文。',
  robots: { index: false, follow: false }
}

function UnavailableNotice({ returnTo }: { returnTo: OutboundReturnPath }) {
  return (
    <SiteShell>
      <section className="border-y border-border py-14 sm:py-20">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">
          Outbound / Paused
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.045em]">链接已停止放行</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
          目标地址无效或不是可访问的 Web 链接，本站没有继续提供跳转入口。
        </p>
        <Link className={actionStyles('outline', 'default', 'mt-8')} href={returnTo}>
          <ArrowLeft aria-hidden="true" />
          返回热点列表
        </Link>
      </section>
    </SiteShell>
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

  const hostname = new URL(destination).hostname

  return (
    <SiteShell>
      <section
        aria-labelledby="outbound-title"
        className="mx-auto w-full max-w-xl border-y border-border py-12 sm:py-16"
      >
        <ShieldAlert aria-hidden="true" className="size-5 text-primary" />
        <p className="mt-5 font-mono text-xs uppercase tracking-[0.14em] text-primary">
          Outbound / External
        </p>
        <h1
          className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl"
          id="outbound-title"
        >
          即将离开本站
        </h1>
        <p className="mt-5 text-sm leading-7 text-muted-foreground">
          你将前往第三方网站。本站仅作信息聚合与索引，不代表本站立场，也不对第三方内容与可用性负责。
        </p>
        <div className="mt-7 flex items-center justify-between gap-4 border-l-2 border-primary pl-4">
          <span className="text-xs text-muted-foreground">目标站点</span>
          <span className="break-all font-mono text-xs text-foreground">{hostname}</span>
        </div>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <a
            className={actionStyles('primary', 'large')}
            href={destination}
            rel="noreferrer noopener external"
            target="_blank"
          >
            继续访问原文
            <ArrowUpRight aria-hidden="true" />
          </a>
          <Link className={actionStyles('outline', 'large')} href={returnTo}>
            <ArrowLeft aria-hidden="true" />
            返回热点列表
          </Link>
        </div>
      </section>
    </SiteShell>
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
