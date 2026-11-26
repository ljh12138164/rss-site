import type { ReactNode } from 'react'
import { SectionLayout } from '../../components/section-layout'
import { socialSources } from '../../lib/technology-sources'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SectionLayout basePath="/social" sectionId="social" sources={socialSources}>
      {children}
    </SectionLayout>
  )
}
