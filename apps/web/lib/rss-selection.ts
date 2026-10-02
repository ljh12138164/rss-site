import { findSignalSource, listSignalSources, type SignalSourceId } from '@rss-site/signals'

export function parseRssSources(value: string | null): SignalSourceId[] {
  if (!value || value.length > 2048) throw new Error('Invalid sources')
  const ids = [...new Set(value.split(','))].sort()
  if (
    ids.length > listSignalSources({ isArticle: true }).length ||
    !ids.every((id) => findSignalSource(id)?.isArticle)
  )
    throw new Error('Invalid sources')
  return ids as SignalSourceId[]
}

export function rssSourcesPath(ids: readonly string[]): string {
  const sources = parseRssSources(ids.join(','))
  return sources.length === 1
    ? `/feeds/${sources[0]}.xml`
    : `/feeds/custom.xml?sources=${sources.join(',')}`
}
