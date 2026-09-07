import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PaginatedArticleFeed } from '../../../components/paginated-article-feed'
import { SourceDetailView } from '../../../components/source-detail'
import type { FeedResult } from '../../../lib/hot-feed'
import {
  getTechnologySource,
  isTechnologySourceId,
  type TechnologySource,
  technologySources
} from '../../../lib/technology-sources'

export const dynamic = 'force-static'
export const revalidate = 21600
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
    title: source.id === 'github-blog' ? source.name : `${source.name} 热榜`,
    description: source.description,
    alternates: { canonical: optionalCanonical(`/technology/${source.id}`) }
  }
}

export function TechnologySourceView({
  source,
  feed
}: {
  source: TechnologySource
  feed: FeedResult
}) {
  return <SourceDetailView basePath="/technology" feed={feed} source={source} />
}

export default async function TechnologySourcePage({ params }: Props) {
  const { source: sourceId } = await params
  if (!isTechnologySourceId(sourceId)) notFound()

  return <PaginatedArticleFeed section="/technology" source={sourceId} />
}

import { optionalCanonical } from '../../../lib/site-url'
