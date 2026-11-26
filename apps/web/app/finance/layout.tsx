import type { ReactNode } from 'react'
import { SectionLayout } from '../../components/section-layout'
import { financeSources } from '../../lib/technology-sources'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SectionLayout basePath="/finance" sectionId="finance" sources={financeSources}>
      {children}
    </SectionLayout>
  )
}
