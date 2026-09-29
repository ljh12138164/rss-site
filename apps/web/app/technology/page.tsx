import { PaginatedArticleFeed } from '../../components/paginated-article-feed'
import { SectionOverview } from '../../components/section-overview'
import type { TechnologyFeeds } from '../../lib/hot-feed'
import { createPageMetadata } from '../../lib/seo'
import { technologyArticleSources } from '../../lib/technology-sources'

export const dynamic = 'force-static'
export const revalidate = 21600

export const metadata = createPageMetadata({
  title: '科技热点',
  description: 'GitHub Blog、开发者社区与科技媒体的最新内容。',
  path: '/technology'
})

export function TechnologyView({ feeds }: { feeds: TechnologyFeeds }) {
  return <SectionOverview basePath="/technology" feeds={feeds} sources={technologyArticleSources} />
}

export default async function TechnologyPage() {
  return <PaginatedArticleFeed section="/technology" />
}
