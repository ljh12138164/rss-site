import type { ReactNode } from 'react'
import { SectionLayout } from '../../components/section-layout'
import { gameSources } from '../../lib/technology-sources'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SectionLayout basePath="/games" sectionId="games" sources={gameSources}>
      {children}
    </SectionLayout>
  )
}
