import type { DailyReport } from '../../../shared/daily-report'

export function formatDailyBriefingText(report: DailyReport, origin?: string): string {
  const lines = [`【今日热点 · ${report.reportDate} 日报】`, '', report.content.overview.text, '']
  for (const [index, story] of report.content.stories.entries()) {
    lines.push(`${String(index + 1).padStart(2, '0')}. ${story.title}`)
    lines.push(story.summary)
    lines.push('')
  }
  const base = origin ? origin.replace(/\/+$/, '') : 'https://news.ljhboard.cn'
  lines.push(`完整日报与出处：${base}/daily/${report.reportDate}`)
  return lines.join('\n')
}
