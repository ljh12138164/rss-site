import type { ReactNode } from 'react'
import { SectionLayout } from '../../components/section-layout'
import { technologySources } from '../../lib/technology-sources'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SectionLayout
      basePath="/technology"
      title="科技热门"
      description="看看 GitHub、Hacker News、掘金、V2EX、IT之家和 36氪最近有哪些热门内容。"
      sectionName="科技"
      sources={technologySources}
    >
      {children}
    </SectionLayout>
  )
}
