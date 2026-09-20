import { PaginatedArticleFeed } from '../../components/paginated-article-feed'
import { SectionOverview } from '../../components/section-overview'
import type { GameFeeds } from '../../lib/hot-feed'
import { createPageMetadata } from '../../lib/seo'
import { gameSources } from '../../lib/technology-sources'

export const dynamic = 'force-static'
export const revalidate = 21600

export const metadata = createPageMetadata({
  title: '游戏热点',
  description: '3DM、机核、游民星空、游侠网与 indienova 的游戏资讯。',
  path: '/games'
})

export function GamesView({ feeds }: { feeds: GameFeeds }) {
  return <SectionOverview basePath="/games" feeds={feeds} sources={gameSources} />
}

export default async function GamesPage() {
  return <PaginatedArticleFeed section="/games" />
}
