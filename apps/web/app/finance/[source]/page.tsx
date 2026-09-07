import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PaginatedArticleFeed } from '../../../components/paginated-article-feed'
import { SourceDetailView } from '../../../components/source-detail'
import type { FeedResult } from '../../../lib/hot-feed'
import {
  type FinanceSource,
  financeSources,
  getFinanceSource,
  isFinanceSourceId
} from '../../../lib/technology-sources'

export const dynamic = 'force-static'
export const revalidate = 21600
export const dynamicParams = false

type Props = { params: Promise<{ source: string }> }

export function generateStaticParams() {
  return financeSources.map((source) => ({ source: source.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { source: sourceId } = await params
  if (!isFinanceSourceId(sourceId)) notFound()

  const source = getFinanceSource(sourceId)
  return {
    title: source.name,
    description: source.description,
    alternates: { canonical: optionalCanonical(`/finance/${source.id}`) }
  }
}

export function FinanceSourceView({ source, feed }: { source: FinanceSource; feed: FeedResult }) {
  return <SourceDetailView basePath="/finance" feed={feed} source={source} />
}

export default async function FinanceSourcePage({ params }: Props) {
  const { source: sourceId } = await params
  if (!isFinanceSourceId(sourceId)) notFound()

  return <PaginatedArticleFeed section="/finance" source={sourceId} />
}

import { optionalCanonical } from '../../../lib/site-url'
