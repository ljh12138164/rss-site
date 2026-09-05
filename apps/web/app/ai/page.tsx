import type { Metadata } from 'next'
import { SectionOverview } from '../../components/section-overview'
import { type AiFeeds, getAiFeeds } from '../../lib/hot-feed'
import { aiSources } from '../../lib/technology-sources'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'AI 最新动态',
  description: '来自 OpenAI、Anthropic、DeepSeek、智谱 GLM、Google AI 和 Qwen 的官方文章。'
}

export function AiView({ feeds }: { feeds: AiFeeds }) {
  return (
    <SectionOverview
      basePath="/ai"
      description="看看 OpenAI、Anthropic、DeepSeek、智谱、Google 和 Qwen 最近发布了什么。"
      feeds={feeds}
      sources={aiSources}
      title="AI 最新动态"
    />
  )
}

export default async function AiPage() {
  return <AiView feeds={await getAiFeeds(3)} />
}
