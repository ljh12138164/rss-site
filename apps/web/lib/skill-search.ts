import type { FeedResult } from './hot-feed'
import { parseSkillMetadata } from './skill-metadata'

function normalize(value: string) {
  return value.normalize('NFKC').toLowerCase()
}

export function searchSkillFeed(feed: FeedResult, query: string): FeedResult {
  const words = normalize(query).trim().split(/\s+/).filter(Boolean)
  if (feed.state !== 'ready' || !words.length) return feed
  return {
    ...feed,
    items: feed.items.filter((item) => {
      const metadata = parseSkillMetadata(item.summary)
      const text = normalize(
        [
          item.title.replace(/^#\d+\s+/, ''),
          item.sourceKey,
          item.author,
          metadata.description,
          metadata.source
        ]
          .filter(Boolean)
          .join(' ')
      )
      return words.every((word) => text.includes(word))
    })
  }
}
