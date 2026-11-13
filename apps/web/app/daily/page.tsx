import type { Metadata } from 'next'
import Link from 'next/link'
import { DailyReportView } from '../../components/daily-report/daily-report-view'
import { SiteShell } from '../../components/site-shell'
import { getDailyArchive, getDailyArticleLinks, getDailyReport } from '../../lib/daily-reports'

export const revalidate = 300
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: '今日日报',
  description: '每日精选 AI、科技及重要要闻摘要与原文出处。',
  alternates: { canonical: '/daily' }
}

export default async function DailyPage() {
  const report = await getDailyReport()
  if (!report)
    return (
      <SiteShell>
        <div className="mx-auto max-w-xl rounded-sm border border-border bg-card p-8 text-center">
          <h1 className="headline-display text-2xl">暂无日报</h1>
          <Link
            href="/"
            className="mt-5 inline-flex min-h-10 items-center font-mono text-xs text-primary hover:underline"
          >
            返回全部热点 →
          </Link>
        </div>
      </SiteShell>
    )
  const [archive, articleLinks] = await Promise.all([
    getDailyArchive(report.reportDate),
    getDailyArticleLinks(report.sources)
  ])
  return (
    <SiteShell>
      <DailyReportView report={report} archive={archive} articleLinks={articleLinks} />
    </SiteShell>
  )
}
