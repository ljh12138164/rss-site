import type { Metadata } from 'next'
import { SectionOverview } from '../../components/section-overview'
import { getSocialFeeds, type SocialFeeds } from '../../lib/hot-feed'
import { socialSources } from '../../lib/technology-sources'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '社交热点',
  description: '来自哔哩哔哩、知乎、酷安、虎扑、少数派和今日头条的公开热门内容。'
}

export function SocialView({ feeds }: { feeds: SocialFeeds }) {
  return (
    <SectionOverview
      basePath="/social"
      description="视频、问答和社区正在关注的内容。"
      feeds={feeds}
      sources={socialSources}
      title="社交热点"
    />
  )
}

export default async function SocialPage() {
  return <SocialView feeds={await getSocialFeeds(3)} />
}
