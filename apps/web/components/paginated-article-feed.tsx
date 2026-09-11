import { Suspense } from 'react'
import { type ArticleFilter, getHomeArticles } from '../lib/home-articles'
import { ArticleHydration } from './article-hydration'
import { HomeArticleList } from './home-article-list'
import { SectionLoading } from './section-loading'

async function ArticleFeed({ section, source }: ArticleFilter) {
  const initialPage = await getHomeArticles(null, undefined, { section, source })
  return (
    <ArticleHydration initialPage={initialPage} section={section} source={source}>
      <HomeArticleList
        key={`${section ?? '/'}:${source ?? 'all'}`}
        section={section}
        source={source}
        initialPage={initialPage}
      />
    </ArticleHydration>
  )
}

export function PaginatedArticleFeed(props: ArticleFilter) {
  return (
    <Suspense fallback={<SectionLoading />}>
      <ArticleFeed {...props} />
    </Suspense>
  )
}
