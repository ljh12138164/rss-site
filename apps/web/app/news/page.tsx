import type { Metadata } from 'next'
import { SectionOverview } from '../../components/section-overview'
import { getNewsFeeds, type NewsFeeds } from '../../lib/hot-feed'
import { newsSources } from '../../lib/technology-sources'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '国内新闻',
  description: '新华社、央视、中新网、澎湃、界面和百度的新闻与热榜。'
}

export function NewsView({ feeds }: { feeds: NewsFeeds }) {
  return <SectionOverview basePath="/news" feeds={feeds} internalArticles sources={newsSources} />
}

export default async function NewsPage() {
  return <NewsView feeds={await getNewsFeeds()} />
}
