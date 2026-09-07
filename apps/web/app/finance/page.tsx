import type { Metadata } from 'next'
import { SectionOverview } from '../../components/section-overview'
import { type FinanceFeeds, getFinanceFeeds } from '../../lib/hot-feed'
import { financeSources } from '../../lib/technology-sources'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '财经热点',
  description: '华尔街见闻、财联社、金十数据、第一财经、证券时报和同花顺财经的热门内容。'
}

export function FinanceView({ feeds }: { feeds: FinanceFeeds }) {
  return <SectionOverview basePath="/finance" feeds={feeds} sources={financeSources} />
}

export default async function FinancePage() {
  return <FinanceView feeds={await getFinanceFeeds(3)} />
}
