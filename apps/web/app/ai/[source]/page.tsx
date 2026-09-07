import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PaginatedArticleFeed } from '../../../components/paginated-article-feed'
import { SourceDetailView } from '../../../components/source-detail'
import type { FeedResult } from '../../../lib/hot-feed'
import {
  type AiSource,
  aiSources,
  getAiSource,
  isAiSourceId
} from '../../../lib/technology-sources'

export const dynamic = 'force-static'
export const revalidate = 7200
export const dynamicParams = false

type Props = { params: Promise<{ source: string }> }

export function generateStaticParams() {
  return aiSources.map((source) => ({ source: source.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { source: sourceId } = await params
  if (!isAiSourceId(sourceId)) notFound()

  const source = getAiSource(sourceId)
  return {
    title: source.name,
    description: source.description,
    alternates: { canonical: optionalCanonical(`/ai/${source.id}`) }
  }
}

export function AiSourceView({ source, feed }: { source: AiSource; feed: FeedResult }) {
  return <SourceDetailView basePath="/ai" feed={feed} source={source} />
}

export default async function AiSourcePage({ params }: Props) {
  const { source: sourceId } = await params
  if (!isAiSourceId(sourceId)) notFound()

  return <PaginatedArticleFeed section="/ai" source={sourceId} />
}

import { optionalCanonical } from '../../../lib/site-url'
