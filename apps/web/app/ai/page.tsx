import { ArrowRight, Cpu } from 'lucide-react'
import Link from 'next/link'
import { PaginatedArticleFeed } from '../../components/paginated-article-feed'
import { SectionOverview } from '../../components/section-overview'
import type { AiFeeds } from '../../lib/hot-feed'
import { createPageMetadata } from '../../lib/seo'
import { AI_DESCRIPTION } from '../../lib/source-page-text'
import { aiSources } from '../../lib/technology-sources'

export const dynamic = 'force-dynamic'
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
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2.5 text-sm font-medium text-foreground">
        <Cpu className="size-4 text-primary" aria-hidden="true" />
        <span>AI 大模型评测榜</span>
      </div>
      <Link
        href="/leaderboard"
        className="inline-flex items-center gap-1 font-mono text-xs font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"
      >
        查看榜单
        <ArrowRight className="size-3.5" aria-hidden="true" />
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
