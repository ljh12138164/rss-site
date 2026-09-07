import {
  type ArticlePageProps,
  ArticleReader,
  articleMetadata,
  renderArticlePage
} from '../../../../components/article-reader'

export const dynamic = 'force-static'
export const revalidate = 21600
export const dynamicParams = true
export function generateStaticParams() {
  return []
}

export function generateMetadata(props: ArticlePageProps) {
  return articleMetadata(props, 'news')
}

export const NewsArticleView = ArticleReader

export default function Page(props: ArticlePageProps) {
  return renderArticlePage(props, 'news')
}
