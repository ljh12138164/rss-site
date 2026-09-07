import type { ArticleFilter, HomeArticlePage } from './home-articles'

export const articleQueryKey = ({ section, source }: ArticleFilter) =>
  ['articles', section ?? '/', source ?? 'all'] as const

export function articlePageOptions(filter: ArticleFilter, cursor: string | null) {
  return {
    queryKey: [...articleQueryKey(filter), 'page', cursor] as const,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    queryFn: async ({ signal }: { signal: AbortSignal }): Promise<HomeArticlePage> => {
      const params = new URLSearchParams()
      if (cursor) params.set('cursor', cursor)
      if (filter.section) params.set('section', filter.section)
      if (filter.source) params.set('source', filter.source)
      const response = await fetch(`/api/articles?${params}`, { signal, cache: 'no-store' })
      if (!response.ok) throw new Error('Articles unavailable')
      return response.json()
    }
  }
}
