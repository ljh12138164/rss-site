import type { ReactNode } from 'react'
import { SectionLayout } from '../../components/section-layout'
import { socialSources } from '../../lib/technology-sources'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SectionLayout
      basePath="/social"
      title="大家在聊什么"
      description="B 站、知乎、酷安、虎扑、少数派和今日头条最近都在聊什么。"
      sectionName="社交"
      sources={socialSources}
    >
      {children}
    </SectionLayout>
  )
}
