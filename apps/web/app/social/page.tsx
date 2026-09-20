import { PaginatedArticleFeed } from '../../components/paginated-article-feed'
import { SectionOverview } from '../../components/section-overview'
import type { SocialFeeds } from '../../lib/hot-feed'
import { createPageMetadata } from '../../lib/seo'
import { socialSources } from '../../lib/technology-sources'

export const dynamic = 'force-static'
export const revalidate = 21600

export const metadata = createPageMetadata({
  title: '社交热点',
  description: '来自哔哩哔哩、知乎、酷安、虎扑、少数派和今日头条的公开热门内容。',
  path: '/social'
})

export function SocialView({ feeds }: { feeds: SocialFeeds }) {
  return <SectionOverview basePath="/social" feeds={feeds} sources={socialSources} />
}

export default async function SocialPage() {
  return <PaginatedArticleFeed section="/social" />
}
