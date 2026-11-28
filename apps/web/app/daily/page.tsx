import type { Metadata } from 'next'
import Link from 'next/link'
import { DailyReportView } from '../../components/daily-report/daily-report-view'
import { TranslatedText } from '../../components/site-language'
import { SiteShell } from '../../components/site-shell'
import { getDailyArchive, getDailyArticleLinks, getDailyReport } from '../../lib/daily-reports'
import {
  createDailyReportStructuredData,
  createPageMetadata,
  serializeStructuredData
} from '../../lib/seo'
import { optionalCanonical } from '../../lib/site-url'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = createPageMetadata({
  title: '今日日报',
  description: '每日精选 AI、科技及重要要闻摘要与原文出处。',
  path: '/daily'
})

export default async function DailyPage() {
  const report = await getDailyReport()
  if (!report)
    return (
      <SiteShell>
        <div className="mx-auto max-w-xl rounded-sm border border-border bg-card p-8 text-center">
          <h1 className="headline-display text-2xl">
            <TranslatedText id="daily.emptyTitle" />
          </h1>
          <Link
            href="/"
            className="mt-5 inline-flex min-h-10 items-center font-mono text-xs text-primary hover:underline"
          >
            <TranslatedText id="daily.backToAll" />
          </Link>
        </div>
      </SiteShell>
    )
  const [archive, articleLinks] = await Promise.all([
    getDailyArchive(report.reportDate),
    getDailyArticleLinks(report.sources)
  ])
  const canonical = optionalCanonical(`/daily/${report.reportDate}`)
  const structuredJson = canonical
    ? serializeStructuredData(
        createDailyReportStructuredData({
          canonical,
          reportDate: report.reportDate,
          title: report.title,
          description: report.content.overview.text,
          publishedAt: report.publishedAt,
          citations: report.sources.map((source) => source.url)
        })
      )
    : undefined
  return (
    <SiteShell>
      <DailyReportView report={report} archive={archive} articleLinks={articleLinks} />
      {structuredJson && <script type="application/ld+json">{structuredJson}</script>}
    </SiteShell>
  )
}
