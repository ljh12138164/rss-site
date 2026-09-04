import type { Metadata } from 'next'
import Link from 'next/link'
import { FeedResultView } from '../../../components/feed-result'
import { FeedStatus } from '../../../components/feed-status'
import { SiteShell } from '../../../components/site-shell'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '../../../components/ui/breadcrumb'
import { type FeedResult, getJuejinFeed } from '../../../lib/hot-feed'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '掘金热榜',
  description: '每五小时更新一次的掘金热门文章榜单。'
}

export function JuejinView({ feed }: { feed: FeedResult }) {
  return (
    <SiteShell>
      <Breadcrumb>
        <BreadcrumbList className="font-mono text-xs">
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">首页</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/#technology">科技</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>掘金</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="pb-10 pt-10 sm:pb-12">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">
          Technology / Juejin
        </p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.045em]">掘金热榜</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
              来自掘金周榜的当前信号，每五小时重新整理一次。
            </p>
          </div>
          {feed.state === 'ready' ? <FeedStatus {...feed.status} /> : null}
        </div>
      </header>

      <FeedResultView feed={feed} />
    </SiteShell>
  )
}

export default async function JuejinPage() {
  return <JuejinView feed={await getJuejinFeed()} />
}
