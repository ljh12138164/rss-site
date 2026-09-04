import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FeedResultView } from '../../../components/feed-result'
import { FeedStatus } from '../../../components/feed-status'
import { SiteShell } from '../../../components/site-shell'
import { SourceFrequencyStrip } from '../../../components/source-frequency-strip'
import { type FeedResult, getTechnologyFeed } from '../../../lib/hot-feed'
import {
  getTechnologySource,
  isTechnologySourceId,
  type TechnologySource,
  technologySources
} from '../../../lib/technology-sources'

export const dynamic = 'force-dynamic'
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
    title: `${source.name} 热榜`,
    description: `${source.description}，约每五小时更新一次。`
  }
}

export function TechnologySourceView({
  source,
  feed
}: {
  source: TechnologySource
  feed: FeedResult
}) {
  return (
    <SiteShell>
      <nav aria-label="面包屑">
        <ol className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
          <li>
            <Link className="min-h-11 py-3 transition-colors hover:text-primary" href="/">
              首页
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link className="min-h-11 py-3 transition-colors hover:text-primary" href="/technology">
              科技
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-foreground">
            {source.shortName}
          </li>
        </ol>
      </nav>

      <header className="pb-10 pt-10 sm:pb-12">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">
          Technology / {source.code}
        </p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.045em]">{source.name} 热榜</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
              {source.description}。约每五小时重新整理一次，保留来源自己的榜单顺序。
            </p>
          </div>
          {feed.state === 'ready' ? <FeedStatus {...feed.status} /> : null}
        </div>
        <div className="mt-9">
          <SourceFrequencyStrip active={source.id} />
        </div>
      </header>

      <FeedResultView feed={feed} />
    </SiteShell>
  )
}

export default async function TechnologySourcePage({ params }: Props) {
  const { source: sourceId } = await params
  if (!isTechnologySourceId(sourceId)) notFound()

  return (
    <TechnologySourceView
      feed={await getTechnologyFeed(sourceId)}
      source={getTechnologySource(sourceId)}
    />
  )
}
