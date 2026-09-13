import type { ReactNode } from 'react'
import { SectionLayout } from '../../components/section-layout'
import { aiSources } from '../../lib/technology-sources'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SectionLayout
      basePath="/ai"
      title="AI 最新动态"
      description="看看 OpenAI、ChatGPT、Anthropic、DeepSeek、智谱、Google 和 Qwen 最近发布了什么。"
      sectionName="AI"
      sources={aiSources}
    >
      {children}
    </SectionLayout>
  )
}
