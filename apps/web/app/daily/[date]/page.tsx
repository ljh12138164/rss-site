import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isReportDate } from '../../../../../shared/daily-report'
import { DailyReportView } from '../../../components/daily-report/daily-report-view'
import { SiteShell } from '../../../components/site-shell'
import { getDailyArchive, getDailyArticleLinks, getDailyReport } from '../../../lib/daily-reports'
import {
  createDailyReportStructuredData,
  createPageMetadata,
  serializeStructuredData,
  toMetaDescription
} from '../../../lib/seo'
import { optionalCanonical } from '../../../lib/site-url'

export const dynamic = 'force-static'
export const revalidate = 300

export function generateStaticParams() {
  return []
}

type Props = { params: Promise<{ date: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params
  if (!isReportDate(date)) notFound()
  const report = await getDailyReport(date)
  if (!report) notFound()
  return createPageMetadata({
    title: `${date} 日报 · ${report.title}`,
    description: toMetaDescription(report.content.overview.text) ?? report.title,
    path: `/daily/${date}`,
    type: 'article',
    publishedTime: report.publishedAt,
    modifiedTime: report.publishedAt
  })
}

export default async function DailyIssuePage({ params }: Props) {
  const { date } = await params
  if (!isReportDate(date)) notFound()
  const report = await getDailyReport(date)
  if (!report) notFound()
  const [archive, articleLinks] = await Promise.all([
    getDailyArchive(date),
    getDailyArticleLinks(report.sources)
  ])
  const canonical = optionalCanonical(`/daily/${date}`)
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
