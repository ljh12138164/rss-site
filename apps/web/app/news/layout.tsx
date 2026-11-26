import type { ReactNode } from 'react'
import { SectionLayout } from '../../components/section-layout'
import { newsSources } from '../../lib/technology-sources'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SectionLayout basePath="/news" sectionId="news" sources={newsSources}>
      {children}
    </SectionLayout>
  )
}
