import type { Metadata } from 'next'
import { PaginatedArticleFeed } from '../../components/paginated-article-feed'
import { SectionOverview } from '../../components/section-overview'
import type { GameFeeds } from '../../lib/hot-feed'
import { gameSources } from '../../lib/technology-sources'

export const dynamic = 'force-static'
export const revalidate = 21600

export const metadata: Metadata = {
  alternates: { canonical: optionalCanonical('/games') },
  title: '游戏热点',
  description: '3DM、机核、游民星空、游侠网与 indienova 的游戏资讯。'
}

export function GamesView({ feeds }: { feeds: GameFeeds }) {
  return <SectionOverview basePath="/games" feeds={feeds} sources={gameSources} />
}

export default async function GamesPage() {
  return <PaginatedArticleFeed section="/games" />
}

import { optionalCanonical } from '../../lib/site-url'
