import { PaginatedArticleFeed } from '../../components/paginated-article-feed'
import { SiteShell } from '../../components/site-shell'
import { createPageMetadata } from '../../lib/seo'

export const dynamic = 'force-static'
export const revalidate = 21600

export const metadata = createPageMetadata({
  title: 'GitHub 中文开源排行',
  description: 'GitHub Trending 中文项目周榜，查看项目作者、语言、Stars 与 Forks。',
  path: '/github'
})

export function GithubRankingHeader() {
  return (
    <header className="mb-8 border-b border-border pb-7 sm:mb-10 sm:pb-9">
      <p className="eyebrow">GitHub Trending · 中文周榜</p>
      <h1 className="headline-display mt-3 text-4xl leading-[1.1] sm:text-5xl">开源排行</h1>
      <p className="mt-4 max-w-2xl text-pretty text-sm leading-6 text-muted-foreground">
        GitHub Trending 中文项目周榜，按热度查看项目作者、编程语言、Stars 与 Forks。
      </p>
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
