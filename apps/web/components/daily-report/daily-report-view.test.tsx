import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import type { DailyReport } from '../../../../shared/daily-report'
import fixture from '../../../../shared/daily-report.fixture.json'
import { DailyReportView } from './daily-report-view'

it('renders events in editorial order without empty sections and prefers internal citations', () => {
  const report = {
    reportDate: '2026-11-04',
    content: {
      ...fixture.draft,
      stories: [1, 2].map((number) => ({
        ...fixture.draft.stories[0],
        id: `s${number}`,
        title: `事件 ${number}`
      }))
    },
    sources: fixture.sources,
    windowStart: '2026-11-02T16:00:00Z',
    windowEnd: '2026-11-03T16:00:00Z',
    publishedAt: '2026-11-04T00:01:00Z',
    storyCount: 2,
    sourceCount: 1
  } as DailyReport
  const source = report.sources[0]
  const render = (articleLinks: Record<string, string>) =>
    renderToStaticMarkup(
      <DailyReportView report={report} archive={{ entries: [] }} articleLinks={articleLinks} />
    )
  const html = render({ [source.id]: '/technology/cloudflare-blog/article' })
  expect(html).not.toContain('本期未收录')
  expect(html).not.toContain('本期重点见头条')
  expect(html).not.toContain('分区目录')
  expect(html.indexOf('id="s1"')).toBeLessThan(html.indexOf('id="s2"'))
  expect(html).toContain('href="/technology/cloudflare-blog/article"')
  expect(html).toContain(source.title)
  expect(html).not.toContain(`href="${source.url}"`)
  expect(render({})).toContain(`href="${source.url}"`)
  report.content.stories = report.content.stories.slice(0, 1)
  expect(render({})).toContain('id="s1"')
  expect(render({})).not.toContain('id="s2"')
})
