import type { Metadata } from 'next'
import { SectionOverview } from '../../components/section-overview'
import { getTechnologyFeeds, type TechnologyFeeds } from '../../lib/hot-feed'
import { technologySources } from '../../lib/technology-sources'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '科技热点',
  description: 'GitHub、Hacker News、掘金、V2EX、IT之家和 36氪的热门内容。'
}

export function TechnologyView({ feeds }: { feeds: TechnologyFeeds }) {
  return (
    <SectionOverview
      basePath="/technology"
      description="开发者社区、科技媒体和开源项目榜单。"
      feeds={feeds}
      sources={technologySources}
      title="科技"
    />
  )
}

export default async function TechnologyPage() {
  return <TechnologyView feeds={await getTechnologyFeeds(3)} />
}
