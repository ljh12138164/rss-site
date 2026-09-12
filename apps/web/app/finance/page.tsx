import type { Metadata } from 'next'
import { PaginatedArticleFeed } from '../../components/paginated-article-feed'
import { SectionOverview } from '../../components/section-overview'
import type { FinanceFeeds } from '../../lib/hot-feed'
import { financeSources } from '../../lib/technology-sources'

export const dynamic = 'force-static'
export const revalidate = 21600

export const metadata: Metadata = {
  alternates: { canonical: optionalCanonical('/finance') },
  title: '财经热点',
  description: '华尔街见闻、财联社、金十数据、第一财经和证券时报的热门内容。'
}

export function FinanceView({ feeds }: { feeds: FinanceFeeds }) {
  return <SectionOverview basePath="/finance" feeds={feeds} sources={financeSources} />
}

export default async function FinancePage() {
  return <PaginatedArticleFeed section="/finance" />
}

import { optionalCanonical } from '../../lib/site-url'
