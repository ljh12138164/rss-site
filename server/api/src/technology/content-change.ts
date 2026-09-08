import type { TechnologyFeedItem } from './feed.js'

export function changedSourceKeys(
  previous: TechnologyFeedItem[],
  next: TechnologyFeedItem[]
): string[] {
  const old = new Map(previous.map((item) => [item.sourceKey, item]))
  const changed = new Set<string>()
  for (const item of next) {
    const prior = old.get(item.sourceKey)
    if (
      !prior ||
      item.title !== prior.title ||
      item.url !== prior.url ||
      item.summary !== prior.summary ||
      item.author !== prior.author ||
      item.position !== prior.position ||
      item.imageUrl !== prior.imageUrl ||
      item.publishedAt?.getTime() !== prior.publishedAt?.getTime() ||
      (item.contentHtml != null && item.contentHtml !== prior.contentHtml)
    )
      changed.add(item.sourceKey)
    old.delete(item.sourceKey)
  }
  for (const key of old.keys()) changed.add(key)
  return [...changed]
}
