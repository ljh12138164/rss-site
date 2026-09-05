import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SourceDetailView } from '../../../components/source-detail'
import { type FeedResult, getSocialFeed } from '../../../lib/hot-feed'
import {
  getSocialSource,
  isSocialSourceId,
  type SocialSource,
  socialSources
} from '../../../lib/technology-sources'

export const dynamic = 'force-dynamic'
export const dynamicParams = false

type Props = { params: Promise<{ source: string }> }

export function generateStaticParams() {
  return socialSources.map((source) => ({ source: source.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { source: sourceId } = await params
  if (!isSocialSourceId(sourceId)) notFound()

  const source = getSocialSource(sourceId)
  return {
    title: source.name,
    description: source.description
  }
}

export function SocialSourceView({ source, feed }: { source: SocialSource; feed: FeedResult }) {
  return (
    <SourceDetailView
      basePath="/social"
      description={source.description}
      feed={feed}
      sectionName="社交"
      source={source}
      sources={socialSources}
    />
  )
}

export default async function SocialSourcePage({ params }: Props) {
  const { source: sourceId } = await params
  if (!isSocialSourceId(sourceId)) notFound()

  return (
    <SocialSourceView feed={await getSocialFeed(sourceId)} source={getSocialSource(sourceId)} />
  )
}
