import { ArrowRight, Cpu } from 'lucide-react'
import Link from 'next/link'
import { PaginatedArticleFeed } from '../../components/paginated-article-feed'
import { SectionOverview } from '../../components/section-overview'
import type { AiFeeds } from '../../lib/hot-feed'
import { createPageMetadata } from '../../lib/seo'
import { AI_DESCRIPTION } from '../../lib/source-page-text'
import { aiSources } from '../../lib/technology-sources'

export const dynamic = 'force-static'
export const revalidate = 7200

export const metadata = createPageMetadata({
  title: 'AI 最新动态',
  description: AI_DESCRIPTION,
  path: '/ai'
})

export function AiView({ feeds }: { feeds: AiFeeds }) {
  return <SectionOverview basePath="/ai" feeds={feeds} sources={aiSources} />
}

export function LeaderboardBanner() {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/60 p-4 transition-colors hover:border-border sm:p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Cpu className="size-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">AI 大模型能力评测榜</p>
          <p className="text-xs text-muted-foreground">
            横向对比主流大模型在编程、科研、Agent 与知识问答维度的公开实测成绩。
          </p>
        </div>
      </div>
      <Link
        href="/leaderboard"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-primary/10 px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-ring"
      >
        查看完整榜单
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  )
}

export default async function AiPage() {
  return (
    <>
      <LeaderboardBanner />
      <PaginatedArticleFeed section="/ai" />
    </>
  )
}
