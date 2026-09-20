import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PaginatedArticleFeed } from '../../../components/paginated-article-feed'
import { SourceDetailView } from '../../../components/source-detail'
import type { FeedResult } from '../../../lib/hot-feed'
import { createPageMetadata } from '../../../lib/seo'
import {
  getNewsSource,
  isNewsSourceId,
  type NewsSource,
  newsSources
} from '../../../lib/technology-sources'

export const dynamic = 'force-static'
export const revalidate = 21600
export const dynamicParams = true

type Props = { params: Promise<{ source: string }> }

export function generateStaticParams() {
  return newsSources.map((source) => ({ source: source.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { source: sourceId } = await params
  if (!isNewsSourceId(sourceId)) notFound()

  const source = getNewsSource(sourceId)
  return createPageMetadata({
    title: source.name,
    description: source.description,
    path: `/news/${source.id}`
  })
}

export function NewsSourceView({ source, feed }: { source: NewsSource; feed: FeedResult }) {
  return <SourceDetailView basePath="/news" feed={feed} source={source} />
}

export default async function NewsSourcePage({ params }: Props) {
  const { source: sourceId } = await params
  if (!isNewsSourceId(sourceId)) notFound()

  return <PaginatedArticleFeed section="/news" source={sourceId} />
}
