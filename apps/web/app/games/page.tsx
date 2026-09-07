import type { Metadata } from 'next'
import { SectionOverview } from '../../components/section-overview'
import { type GameFeeds, getGameFeeds } from '../../lib/hot-feed'
import { gameSources } from '../../lib/technology-sources'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '游戏热点',
  description: '3DM、机核、游民星空、游侠网、indienova 与 Steam 的游戏资讯和榜单。'
}

export function GamesView({ feeds }: { feeds: GameFeeds }) {
  return <SectionOverview basePath="/games" feeds={feeds} sources={gameSources} />
}

export default async function GamesPage() {
  return <GamesView feeds={await getGameFeeds(3)} />
}
