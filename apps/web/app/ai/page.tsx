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

export default async function AiPage() {
  return <PaginatedArticleFeed section="/ai" />
}
