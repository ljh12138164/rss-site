import type { ReactNode } from 'react'
import { SectionLayout } from '../../components/section-layout'
import { technologyArticleSources } from '../../lib/technology-sources'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SectionLayout basePath="/technology" sectionId="technology" sources={technologyArticleSources}>
      {children}
    </SectionLayout>
  )
}
