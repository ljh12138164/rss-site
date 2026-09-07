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
    description: source.description
  }
}

export function GameSourceView({ source, feed }: { source: GameSource; feed: FeedResult }) {
  return <SourceDetailView basePath="/games" feed={feed} source={source} />
}

export default async function GameSourcePage({ params }: Props) {
  const { source: sourceId } = await params
  if (!isGameSourceId(sourceId)) notFound()

  return <GameSourceView feed={await getGameFeed(sourceId)} source={getGameSource(sourceId)} />
}
