import type { ReactNode } from 'react'
import { SectionLayout } from '../../components/section-layout'
import { aiSources } from '../../lib/technology-sources'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SectionLayout basePath="/ai" sectionId="ai" sources={aiSources}>
      {children}
    </SectionLayout>
  )
}
