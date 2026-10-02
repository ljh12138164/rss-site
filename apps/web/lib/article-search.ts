import { getSignalSource } from '@rss-site/signals'
import { parseArticleFilter } from './home-articles'

export const SEARCH_PAGE_SIZE = 20

export type SearchRange = 'all' | 'day' | 'week'

export function parseSearchScope(
  section: string | null,
  source: string | null,
  range = 'all',
  at?: string,
  now = Date.now()
) {
  const filter = parseArticleFilter(section, source)
  if (filter.source && !getSignalSource(filter.source).isArticle) throw new Error('Invalid source')
  if (!['all', 'day', 'week'].includes(range)) throw new Error('Invalid range')
  const timestamp = at === undefined ? now : Date.parse(at)
  if (!Number.isFinite(timestamp) || timestamp > now + 60000 || timestamp < 0)
    throw new Error('Invalid snapshot')
  return {
    ...filter,
    at: new Date(timestamp).toISOString(),
    since:
      range === 'all'
        ? undefined
        : new Date(timestamp - (range === 'day' ? 1 : 7) * 86400000).toISOString()
  }
}

export interface SearchArticle {
  id: string
  title: string
  summary: string | null
  source: string
  section: string
  url: string
  published_at: string | null
}

export function searchValidation(query: string) {
  if (Array.from(query.trim()).length < 2) return '请输入至少 2 个字或字符'
  if (query.length > 80) return '关键词请控制在 80 个字符以内'
  if (query.includes('*')) return '请去掉星号后再搜索'
  return null
}

export function searchFilter(query: string) {
  // Quote the PostgREST value separately from escaping SQL LIKE wildcards.
  const pattern = JSON.stringify(`%${query.replace(/[\\%_]/g, '\\$&')}%`)
  return `title.ilike.${pattern},summary.ilike.${pattern}`
}

export function searchExcerpt(text: string, query: string) {
  const position = text.toLowerCase().indexOf(query.toLowerCase())
  const start = Math.max(0, position - 30)
  const end = start + Math.max(120, query.length + 60)
  return `${start ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`
}
