import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { DailyReport } from '../../../../shared/daily-report'
import { DailyReportView } from './daily-report-view'

const fixture = JSON.parse(
  readFileSync(new URL('../../../../shared/daily-report.fixture.json', import.meta.url), 'utf8')
)
const report: DailyReport = {
  reportDate: fixture.reportDate,
  title: fixture.draft.stories[0].title,
  content: fixture.draft,
  sources: fixture.sources,
  windowStart: '2026-11-02T16:00:00Z',
  windowEnd: '2026-11-03T16:00:00Z',
  publishedAt: '2026-11-04T00:05:00Z',
  storyCount: 1,
  sourceCount: 1
}
const issue = {
  report_date: report.reportDate,
  title: report.title,
  published_at: report.publishedAt
}

describe('daily editorial page', () => {
  it('renders the real issue date, source links, headline anchors and honest empty sections', () => {
    const html = renderToStaticMarkup(
      <DailyReportView
        report={report}
        archive={{
          entries: [issue],
          previous: undefined,
          next: undefined,
          previousMonth: undefined,
          nextMonth: undefined
        }}
        articleLinks={{}}
      />
    )
    expect(html).toContain('2026-11-04')
    expect(html).toContain('2026-11-03 全天')
    expect(html).toContain('https://example.com/image-rules')
    expect(html).toContain('id="s1"')
    expect(html).toContain('href="#s1"')
    expect(html).toContain('本期未收录')
    expect(html).not.toContain('站内阅读')
    expect(html).not.toContain('正在生成')
  })
  it('escapes model prose and shows an internal link only when its article still exists', () => {
    const content = structuredClone(report.content)
    content.stories = content.stories.map((story) => ({
      ...story,
      title: '<script>alert(1)</script>'
    }))
    const html = renderToStaticMarkup(
      <DailyReportView
        report={{ ...report, content }}
        archive={{
          entries: [issue],
          previous: undefined,
          next: undefined,
          previousMonth: undefined,
          nextMonth: undefined
        }}
        articleLinks={{ [fixture.sources[0].id]: '/technology/cloudflare-blog/article--id' }}
      />
    )
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
    expect(html).toContain('站内阅读')
  })
})
