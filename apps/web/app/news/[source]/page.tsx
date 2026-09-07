import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SourceDetailView } from '../../../components/source-detail'
import { type FeedResult, getNewsFeed } from '../../../lib/hot-feed'
import {
  getNewsSource,
  isNewsSourceId,
  type NewsSource,
  newsSources
} from '../../../lib/technology-sources'

export const dynamic = 'force-dynamic'
export const dynamicParams = false

type Props = { params: Promise<{ source: string }> }

export function generateStaticParams() {
  return newsSources.map((source) => ({ source: source.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { source: sourceId } = await params
  if (!isNewsSourceId(sourceId)) notFound()

  const source = getNewsSource(sourceId)
  return {
    title: source.name,
    description: source.description
  }
}

export function NewsSourceView({ source, feed }: { source: NewsSource; feed: FeedResult }) {
  return <SourceDetailView basePath="/news" feed={feed} internalArticles source={source} />
}

export default async function NewsSourcePage({ params }: Props) {
  const { source: sourceId } = await params
  if (!isNewsSourceId(sourceId)) notFound()

  return <NewsSourceView feed={await getNewsFeed(sourceId)} source={getNewsSource(sourceId)} />
}
