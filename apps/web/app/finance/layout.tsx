import type { ReactNode } from 'react'
import { SectionLayout } from '../../components/section-layout'
import { financeSources } from '../../lib/technology-sources'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SectionLayout
      basePath="/finance"
      title="财经"
      description="看看市场快讯和财经媒体今天在关注什么。"
      sectionName="财经"
      sources={financeSources}
    >
      {children}
    </SectionLayout>
  )
}
