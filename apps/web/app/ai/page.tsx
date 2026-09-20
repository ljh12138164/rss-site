import { PaginatedArticleFeed } from '../../components/paginated-article-feed'
import { SectionOverview } from '../../components/section-overview'
import type { AiFeeds } from '../../lib/hot-feed'
import { createPageMetadata } from '../../lib/seo'
import { aiSources } from '../../lib/technology-sources'

export const dynamic = 'force-static'
export const revalidate = 7200

export const metadata = createPageMetadata({
  title: 'AI 最新动态',
  description:
    '来自 OpenAI、ChatGPT、Anthropic、DeepSeek、智谱 GLM、Google AI 和 Qwen 的官方文章。',
  path: '/ai'
})

export function AiView({ feeds }: { feeds: AiFeeds }) {
  return <SectionOverview basePath="/ai" feeds={feeds} sources={aiSources} />
}

export default async function AiPage() {
  return <PaginatedArticleFeed section="/ai" />
}
