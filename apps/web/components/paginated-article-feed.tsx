import { type ArticleFilter, getHomeArticles } from '../lib/home-articles'
import { ArticleHydration } from './article-hydration'
import { HomeArticleList } from './home-article-list'

export async function PaginatedArticleFeed({ section, source }: ArticleFilter) {
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
