import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { articleQueryKey } from '../lib/article-query'
import type { ArticleFilter, HomeArticlePage } from '../lib/home-articles'

export function ArticleHydration({
  initialPage,
  initialError = false,
  children,
  section,
  source
}: ArticleFilter & { initialPage: HomeArticlePage; initialError?: boolean; children: ReactNode }) {
  const client = new QueryClient()
  if (!initialError)
    client.setQueryData(articleQueryKey({ section, source }), {
      pages: [initialPage],
      pageParams: [null]
    })
  return <HydrationBoundary state={dehydrate(client)}>{children}</HydrationBoundary>
}
