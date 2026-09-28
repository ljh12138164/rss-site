import { hc } from 'hono/client'
import type { ArticleFilter, HomeArticlePage } from './home-articles'
import type { AppType } from './hono-app'

const api = hc<AppType>('/')

export const articleQueryKey = ({ section, source }: ArticleFilter) =>
  ['articles', section ?? '/', source ?? 'all'] as const

export function articlePageOptions(filter: ArticleFilter, cursor: string | null) {
  return {
    queryKey: [...articleQueryKey(filter), 'page', cursor] as const,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    queryFn: async ({ signal }: { signal: AbortSignal }): Promise<HomeArticlePage> => {
      const response = await api.api.articles.$get(
        { query: { cursor: cursor ?? undefined, section: filter.section, source: filter.source } },
        { init: { signal, cache: 'no-store' } }
      )
      if (response.status !== 200) throw new Error('Articles unavailable')
      return response.json()
    }
  }
}
