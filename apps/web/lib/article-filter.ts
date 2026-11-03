import {
  aiSources,
  financeSources,
  gameSources,
  newsSources,
  type SignalSourceId,
  socialSources,
  technologySources
} from '@rss-site/signals'
import type { OutboundReturnPath } from './outbound-link'

export const articleSections = [
  { path: '/ai', sources: aiSources },
  { path: '/technology', sources: technologySources },
  { path: '/news', sources: newsSources },
  { path: '/social', sources: socialSources },
  { path: '/finance', sources: financeSources },
  { path: '/games', sources: gameSources }
] as const

const sources = articleSections.flatMap(({ path, sources }) =>
  sources.map((source) => ({ source, path }))
)

export interface ArticleFilter {
  section?: Exclude<OutboundReturnPath, '/'>
  source?: SignalSourceId
  sources?: SignalSourceId[]
}

export function parseArticleFilter(
  section: string | null,
  source: string | null,
  selected: string | null = null
): ArticleFilter {
  if (section !== null && !articleSections.some((entry) => entry.path === section))
    throw new Error('Invalid section')
  if (
    source !== null &&
    !sources.some((entry) => entry.source.id === source && (!section || entry.path === section))
  )
    throw new Error('Invalid source')
  const sourceIds = selected === null ? undefined : [...new Set(selected.split(','))].sort()
  if (
    sourceIds &&
    (source !== null ||
      sourceIds.length > sources.length ||
      !sourceIds.every((id) =>
        sources.some(
          (entry) =>
            entry.source.id === id && entry.source.isArticle && (!section || entry.path === section)
        )
      ))
  )
    throw new Error('Invalid sources')
  return {
    section: (section ?? undefined) as ArticleFilter['section'],
    source: (source ?? undefined) as ArticleFilter['source'],
    ...(sourceIds ? { sources: sourceIds as SignalSourceId[] } : {})
  }
}
