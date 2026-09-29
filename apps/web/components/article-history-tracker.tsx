'use client'

import { useEffect } from 'react'
import { recordReadingHistory } from '../lib/reading-list'

export function ArticleHistoryTracker({
  id,
  title,
  url,
  source,
  sourceName,
  section
}: {
  id: string
  title: string
  url: string
  source?: string
  sourceName?: string
  section?: string
}) {
  useEffect(() => {
    if (id && title) {
      recordReadingHistory({
        id,
        title,
        url,
        source,
        sourceName,
        section
      })
    }
  }, [id, title, url, source, sourceName, section])

  return null
}
