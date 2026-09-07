import type { Metadata } from 'next'
import { PaginatedArticleFeed } from '../../components/paginated-article-feed'
import { SectionOverview } from '../../components/section-overview'
import type { NewsFeeds } from '../../lib/hot-feed'
import { newsSources } from '../../lib/technology-sources'

export const dynamic = 'force-static'
export const revalidate = 21600

export const metadata: Metadata = {
  alternates: { canonical: optionalCanonical('/news') },
  title: '国内新闻',
  description: '新华社、央视、中新网、澎湃、界面和百度的新闻与热榜。'
}

export function NewsView({ feeds }: { feeds: NewsFeeds }) {
  return <SectionOverview basePath="/news" feeds={feeds} sources={newsSources} />
}

export default async function NewsPage() {
  return <PaginatedArticleFeed section="/news" />
}

import { optionalCanonical } from '../../lib/site-url'
