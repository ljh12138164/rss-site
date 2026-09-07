import type { ReactNode } from 'react'
import { SectionLayout } from '../../components/section-layout'
import { gameSources } from '../../lib/technology-sources'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SectionLayout
      basePath="/games"
      title="游戏"
      description="游戏新闻、新文章和 Steam 热销榜都放在这里。"
      sectionName="游戏"
      sources={gameSources}
    >
      {children}
    </SectionLayout>
  )
}
