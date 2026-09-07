import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SourceDetailView } from '../../../components/source-detail'
import { type FeedResult, getFinanceFeed } from '../../../lib/hot-feed'
import {
  type FinanceSource,
  financeSources,
  getFinanceSource,
  isFinanceSourceId
} from '../../../lib/technology-sources'

export const dynamic = 'force-dynamic'
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
    description: source.description
  }
}

export function FinanceSourceView({ source, feed }: { source: FinanceSource; feed: FeedResult }) {
  return <SourceDetailView basePath="/finance" feed={feed} source={source} />
}

export default async function FinanceSourcePage({ params }: Props) {
  const { source: sourceId } = await params
  if (!isFinanceSourceId(sourceId)) notFound()

  return (
    <FinanceSourceView feed={await getFinanceFeed(sourceId)} source={getFinanceSource(sourceId)} />
  )
}
