import type { ReactNode } from 'react'
import { SectionLayout } from '../../components/section-layout'
import { newsSources } from '../../lib/technology-sources'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SectionLayout
      basePath="/news"
      title="国内新闻"
      description="看看新华社、央视、中新网、澎湃、界面和百度正在关注什么。"
      sectionName="新闻"
      sources={newsSources}
    >
      {children}
    </SectionLayout>
  )
}
