import {
  getSignalSource,
  isSignalSourceId,
  listSignalSources,
  signalSections
} from '@rss-site/signals'
import type { ArticleFilter } from './home-articles'
import type { RevalidationScope } from './revalidate-paths'

export function articleListScope({ section, source, sources }: ArticleFilter): string | null {
  if (sources !== undefined) return null
  if (source) {
    if (!isSignalSourceId(source)) return null
    const entry = getSignalSource(source)
    if (entry.section === 'skills' || (section && section !== `/${entry.section}`)) return null
    return `source:${source}`
  }
  const entry = signalSections.find((entry) => entry.path === section && entry.hasArticles)
  return entry ? `section:${entry.id}` : null
}

export function listCacheTargets() {
  return [
    ...signalSections
      .filter((section) => section.hasArticles)
      .map((section) => ({
        scope: `section:${section.id}`,
        filter: { section: section.path } as ArticleFilter
      })),
    ...listSignalSources()
      .filter((source) => source.section !== 'skills')
      .map((source) => ({
        scope: `source:${source.id}`,
        filter: { section: `/${source.section}`, source: source.id } as ArticleFilter
      })),
    { scope: 'skills', filter: null }
  ]
}

export function affectedListScopes({ section, source }: RevalidationScope): string[] {
  if (section === '/skills') return ['skills']
  if (!source || !isSignalSourceId(source)) return []
  const entry = getSignalSource(source)
  if (section !== `/${entry.section}`) return []
  return source === 'github' ? ['source:github'] : [`source:${source}`, `section:${entry.section}`]
}
