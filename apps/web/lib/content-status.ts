import { unstable_cache } from 'next/cache'
import { articleSource } from './article-route'
import { readContentStatus } from './business-queries'
import { getDailyReport } from './daily-reports'

export async function getDailyReportStatus(date: string) {
  return (await getDailyReport(date)) ? 200 : 404
}

export function getContentStatus(kind: 'event' | 'news', id: string, source: string) {
  return unstable_cache(
    async () => {
      return readContentStatus(kind, id, source, articleSource(source)?.section.id ?? '')
    },
    ['content-status', kind, id, source],
    {
      revalidate: kind === 'event' ? 7200 : 21600,
      tags: [kind === 'event' ? 'event-status' : `news-status:${source}`]
    }
  )()
}
