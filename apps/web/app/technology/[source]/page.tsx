import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SourceDetailView } from '../../../components/source-detail'
import { type FeedResult, getTechnologyFeed } from '../../../lib/hot-feed'
import {
  getTechnologySource,
  isTechnologySourceId,
  type TechnologySource,
  technologySources
} from '../../../lib/technology-sources'

export const dynamic = 'force-dynamic'
export const dynamicParams = false

type Props = { params: Promise<{ source: string }> }

export function generateStaticParams() {
  return technologySources.map((source) => ({ source: source.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { source: sourceId } = await params
  if (!isTechnologySourceId(sourceId)) notFound()

  const source = getTechnologySource(sourceId)
  return {
    title: `${source.name} 热榜`,
    description: `${source.description}，约每五小时更新一次。`
  }
}

export function TechnologySourceView({
  source,
  feed
}: {
  source: TechnologySource
  feed: FeedResult
}) {
  return (
    <SourceDetailView
      basePath="/technology"
      description={`${source.description}。约每五小时重新整理一次，保留来源自己的榜单顺序。`}
      eyebrow="Technology"
      feed={feed}
      sectionName="科技"
      source={source}
      sources={technologySources}
      titleSuffix="热榜"
    />
  )
}

export default async function TechnologySourcePage({ params }: Props) {
  const { source: sourceId } = await params
  if (!isTechnologySourceId(sourceId)) notFound()

  return (
    <TechnologySourceView
      feed={await getTechnologyFeed(sourceId)}
      source={getTechnologySource(sourceId)}
    />
  )
}
