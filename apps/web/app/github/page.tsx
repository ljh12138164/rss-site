import type { Metadata } from 'next'
import { PaginatedArticleFeed } from '../../components/paginated-article-feed'
import { SiteShell } from '../../components/site-shell'
import { optionalCanonical } from '../../lib/site-url'

export const dynamic = 'force-static'
export const revalidate = 21600

export const metadata: Metadata = {
  alternates: { canonical: optionalCanonical('/github') },
  title: 'GitHub 中文开源排行',
  description: 'GitHub Trending 中文项目周榜，查看项目作者、语言、Stars 与 Forks。'
}

export function GithubRankingHeader() {
  return (
    <header className="mb-8 sm:mb-10">
      <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
        <span aria-hidden="true" className="font-mono text-sm font-bold tracking-tight">
          GH
        </span>
      </div>
      <h1 className="text-balance text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
        开源排行
      </h1>
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
