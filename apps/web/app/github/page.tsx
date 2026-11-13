import { PaginatedArticleFeed } from '../../components/paginated-article-feed'
import { SiteShell } from '../../components/site-shell'
import { createPageMetadata } from '../../lib/seo'

export const dynamic = 'force-dynamic'
export const revalidate = 21600

export const metadata = createPageMetadata({
  title: 'GitHub 中文开源排行',
  description: 'GitHub Trending 中文项目周榜，查看项目作者、语言、Stars 与 Forks。',
  path: '/github'
})

export function GithubRankingHeader() {
  return (
    <header className="mb-6 flex flex-wrap items-center gap-2.5 border-b border-border pb-4">
      <span
        aria-hidden="true"
        className="size-3 shrink-0 rounded-full"
        style={{ backgroundColor: 'var(--line-tech)' }}
      />
      <h1 className="headline-display text-2xl text-foreground sm:text-3xl">GitHub 中文开源排行</h1>
    </header>
  )
}

export default function GithubRankingPage() {
  return (
    <SiteShell>
      <GithubRankingHeader />
      <PaginatedArticleFeed section="/technology" source="github" />
    </SiteShell>
  )
}
