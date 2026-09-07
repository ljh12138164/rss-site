import Link from 'next/link'
import { ArticleHydration } from '../components/article-hydration'
import { HomeArticleList } from '../components/home-article-list'
import { SiteShell } from '../components/site-shell'
import { getHomeArticles, type HomeArticlePage } from '../lib/home-articles'

export const dynamic = 'force-static'
export const revalidate = 7200
export const metadata = { alternates: { canonical: optionalCanonical('/') } }

export function HomeView({
  initialPage,
  initialError = false
}: {
  initialPage: HomeArticlePage
  initialError?: boolean
}) {
  return (
    <SiteShell>
      <header className="pb-8 sm:pb-10">
        <h1 className="text-balance text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
          今日热点
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-sm leading-6 text-muted-foreground">
          汇总各分区的全部文章，按发布时间从新到旧阅读。
        </p>
      </header>
      <nav aria-label="内容分区" className="mb-10 min-w-0 border-b border-border">
        <p className="mb-1 text-xs font-medium text-muted-foreground">内容分区</p>
        <div className="flex gap-5 overflow-x-auto sm:flex-wrap sm:gap-x-7">
          <Link
            href="/"
            aria-current="page"
            className="flex min-h-11 shrink-0 items-center border-b-2 border-primary px-0.5 text-sm font-medium text-primary"
          >
            全部
          </Link>
          {(
            [
              ['/ai', 'AI'],
              ['/technology', '科技'],
              ['/news', '国内新闻'],
              ['/social', '社交热点'],
              ['/finance', '财经'],
              ['/games', '游戏'],
              ['/technology/github', '开源榜']
            ] as const
          ).map(([href, title]) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-11 shrink-0 items-center whitespace-nowrap border-b-2 border-transparent px-0.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
            >
              {title}
            </Link>
          ))}
        </div>
      </nav>
      <ArticleHydration initialPage={initialPage} initialError={initialError}>
        <HomeArticleList initialPage={initialPage} initialError={initialError} />
      </ArticleHydration>
    </SiteShell>
  )
}

export default async function HomePage() {
  const initialPage = await getHomeArticles()
  return <HomeView initialPage={initialPage} />
}

import { optionalCanonical } from '../lib/site-url'
