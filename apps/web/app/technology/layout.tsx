import type { ReactNode } from 'react'
import { SectionLayout } from '../../components/section-layout'
import { technologySources } from '../../lib/technology-sources'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SectionLayout
      basePath="/technology"
      title="科技热门"
      description="阅读 GitHub Blog、Hacker News、掘金、V2EX、IT之家和 36氪的最新内容，查看 GitHub 开源周榜。"
      sectionName="科技"
      sources={technologySources}
    >
      {children}
    </SectionLayout>
  )
}
