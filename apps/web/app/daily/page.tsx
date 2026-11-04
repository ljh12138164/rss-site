import type { Metadata } from 'next'
import Link from 'next/link'
import { DailyReportView } from '../../components/daily-report/daily-report-view'
import { SiteShell } from '../../components/site-shell'
import { getDailyArchive, getDailyArticleLinks, getDailyReport } from '../../lib/daily-reports'

export const revalidate = 300
export const metadata: Metadata = {
  title: '每日要闻 · 日报',
  description: '每天精选值得关注的 AI、科技及其他重要消息，附原文来源与往期归档',
  alternates: { canonical: '/daily' }
}

export default async function DailyPage() {
  const report = await getDailyReport()
  if (!report)
    return (
      <SiteShell>
        <div className="mx-auto max-w-2xl py-16">
          <p className="eyebrow mb-4 text-primary">每日要闻</p>
          <h1 className="headline-display text-4xl">暂无已发布日报</h1>
          <p className="mt-5 text-muted-foreground">日报发布后会出现在这里</p>
          <Link
            href="/latest"
            className="mt-6 inline-flex min-h-11 items-center text-primary underline underline-offset-4"
          >
            浏览最新热点 →
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
