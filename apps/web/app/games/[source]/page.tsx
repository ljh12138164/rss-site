import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SourceDetailView } from '../../../components/source-detail'
import { type FeedResult, getGameFeed } from '../../../lib/hot-feed'
import {
  type GameSource,
  gameSources,
  getGameSource,
  isGameSourceId
} from '../../../lib/technology-sources'

export const dynamic = 'force-dynamic'
export const dynamicParams = false

type Props = { params: Promise<{ source: string }> }

export function generateStaticParams() {
  return gameSources.map((source) => ({ source: source.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { source: sourceId } = await params
  if (!isGameSourceId(sourceId)) notFound()

  const source = getGameSource(sourceId)
  return {
    title: source.name,
    description: `${source.description}，约每六小时更新一次。`
  }
}

export function GameSourceView({ source, feed }: { source: GameSource; feed: FeedResult }) {
  const updateDescription =
    source.id === 'steam'
      ? '每六小时采集一次当前商店热销榜；采集时间只表示榜单快照更新时间。'
      : '约每六小时重新整理一次，保留来源自己的发布与编辑顺序。'

  return (
    <SourceDetailView
      basePath="/games"
      description={`${source.description}。${updateDescription}`}
      eyebrow="Games"
      feed={feed}
      sectionName="游戏"
      source={source}
      sources={gameSources}
      titleSuffix=""
    />
  )
}

export default async function GameSourcePage({ params }: Props) {
  const { source: sourceId } = await params
  if (!isGameSourceId(sourceId)) notFound()

  return <GameSourceView feed={await getGameFeed(sourceId)} source={getGameSource(sourceId)} />
}
