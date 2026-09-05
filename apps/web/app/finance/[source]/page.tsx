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
    description: `${source.description}，约每六小时更新一次。`
  }
}

export function FinanceSourceView({ source, feed }: { source: FinanceSource; feed: FeedResult }) {
  return (
    <SourceDetailView
      basePath="/finance"
      description={`${source.description}。约每六小时重新整理一次，保留来源自己的热榜、头条或快讯顺序。`}
      eyebrow="Finance"
      feed={feed}
      sectionName="财经"
      source={source}
      sources={financeSources}
      titleSuffix=""
    />
  )
}

export default async function FinanceSourcePage({ params }: Props) {
  const { source: sourceId } = await params
  if (!isFinanceSourceId(sourceId)) notFound()

  return (
    <FinanceSourceView feed={await getFinanceFeed(sourceId)} source={getFinanceSource(sourceId)} />
  )
}
