import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SourceDetailView } from '../../../components/source-detail'
import { type FeedResult, getAiFeed } from '../../../lib/hot-feed'
import {
  type AiSource,
  aiSources,
  getAiSource,
  isAiSourceId
} from '../../../lib/technology-sources'

export const dynamic = 'force-dynamic'
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
    description: source.description
  }
}

export function AiSourceView({ source, feed }: { source: AiSource; feed: FeedResult }) {
  return (
    <SourceDetailView
      basePath="/ai"
      description={source.description}
      feed={feed}
      sectionName="AI 平台"
      source={source}
      sources={aiSources}
    />
  )
}

export default async function AiSourcePage({ params }: Props) {
  const { source: sourceId } = await params
  if (!isAiSourceId(sourceId)) notFound()

  return <AiSourceView feed={await getAiFeed(sourceId)} source={getAiSource(sourceId)} />
}
