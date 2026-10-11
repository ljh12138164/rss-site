import type { ReactNode } from 'react'
import { SectionLayout } from '../../components/section-layout'
import { AI_DESCRIPTION } from '../../lib/source-page-text'
import { aiSources } from '../../lib/technology-sources'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SectionLayout
      basePath="/ai"
      title="AI 最新动态"
      description={AI_DESCRIPTION}
      sectionName="AI"
      sources={aiSources}
    >
      {children}
    </SectionLayout>
  )
}
