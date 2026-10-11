import type { ArticleFilter } from './home-articles'

export function articleArchiveHref(filter: ArticleFilter, cursor: string) {
  const section = filter.section?.slice(1)
  if (!section || filter.sources || filter.source === 'github') return undefined
  return `/archive/${section}${filter.source ? `/${filter.source}` : ''}?cursor=${encodeURIComponent(cursor)}`
}
