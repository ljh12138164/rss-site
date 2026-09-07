import {
  type ArticlePageProps,
  articleMetadata,
  renderArticlePage
} from '../../../../components/article-reader'

export const dynamic = 'force-static'
export const revalidate = 7200
export const dynamicParams = true
export function generateStaticParams() {
  return []
}

export function generateMetadata(props: ArticlePageProps) {
  return articleMetadata(props, 'ai')
}

export default function Page(props: ArticlePageProps) {
  return renderArticlePage(props, 'ai')
}
