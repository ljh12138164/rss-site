import type { Metadata } from 'next'
import { PaginatedArticleFeed } from '../../components/paginated-article-feed'
import { SectionOverview } from '../../components/section-overview'
import type { AiFeeds } from '../../lib/hot-feed'
import { aiSources } from '../../lib/technology-sources'

export const dynamic = 'force-static'
export const revalidate = 7200

export const metadata: Metadata = {
  alternates: { canonical: optionalCanonical('/ai') },
  title: 'AI 最新动态',
  description: '来自 OpenAI、Anthropic、DeepSeek、智谱 GLM、Google AI 和 Qwen 的官方文章。'
}

export function AiView({ feeds }: { feeds: AiFeeds }) {
  return <SectionOverview basePath="/ai" feeds={feeds} sources={aiSources} />
}

export default async function AiPage() {
  return <PaginatedArticleFeed section="/ai" />
}

import { optionalCanonical } from '../../lib/site-url'
