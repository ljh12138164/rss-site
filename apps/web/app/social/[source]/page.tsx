import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PaginatedArticleFeed } from '../../../components/paginated-article-feed'
import { SourceDetailView } from '../../../components/source-detail'
import type { FeedResult } from '../../../lib/hot-feed'
import {
  getSocialSource,
  isSocialSourceId,
  type SocialSource,
  socialSources
} from '../../../lib/technology-sources'

export const dynamic = 'force-static'
export const revalidate = 21600
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
    description: source.description,
    alternates: { canonical: optionalCanonical(`/social/${source.id}`) }
  }
}

export function SocialSourceView({ source, feed }: { source: SocialSource; feed: FeedResult }) {
  return <SourceDetailView basePath="/social" feed={feed} source={source} />
}

export default async function SocialSourcePage({ params }: Props) {
  const { source: sourceId } = await params
  if (!isSocialSourceId(sourceId)) notFound()

  return <PaginatedArticleFeed section="/social" source={sourceId} />
}

import { optionalCanonical } from '../../../lib/site-url'
