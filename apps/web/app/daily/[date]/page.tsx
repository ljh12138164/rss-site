import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isReportDate } from '../../../../../shared/daily-report'
import { DailyReportView } from '../../../components/daily-report/daily-report-view'
import { SiteShell } from '../../../components/site-shell'
import { getDailyArchive, getDailyArticleLinks, getDailyReport } from '../../../lib/daily-reports'

export const revalidate = 300
type Props = { params: Promise<{ date: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params
  if (!isReportDate(date)) notFound()
  const report = await getDailyReport(date)
  if (!report) notFound()
  return {
    title: `${date} 日报 · ${report.title}`,
    description: report.content.overview.text,
    alternates: { canonical: `/daily/${date}` }
  }
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
  return (
    <SiteShell>
      <DailyReportView report={report} archive={archive} articleLinks={articleLinks} />
    </SiteShell>
  )
}
