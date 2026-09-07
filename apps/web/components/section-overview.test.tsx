import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import type { FeedResult } from '../lib/hot-feed'
import { aiSources } from '../lib/technology-sources'
import { SectionOverview } from './section-overview'

it('merges platforms by publication date with summaries and continuous numbering', () => {
  const feeds: Record<string, FeedResult> = Object.fromEntries(
    aiSources.map((source) => [source.id, { state: 'empty' }])
  )
  for (const [index, source] of aiSources.slice(0, 3).entries()) {
    feeds[source.id] = {
      state: 'ready',
      items: [
        {
          sourceKey: 'same-key',
          title: `Article ${index}`,
          url: 'https://example.com',
          summary: index === 1 ? '摘'.repeat(300) : null,
          author: null,
          publishedAt: index === 2 ? null : new Date(`2026-09-0${index + 1}T00:00:00Z`),
          position: 8
        }
      ],
      status: { itemCount: 1, lastSuccessAt: new Date() }
    }
  }
  const html = renderToStaticMarkup(
    <SectionOverview basePath="/ai" sources={aiSources} feeds={feeds} />
  )
  expect(html.indexOf('Article 1')).toBeLessThan(html.indexOf('Article 0'))
  expect(html.indexOf('Article 0')).toBeLessThan(html.indexOf('Article 2'))
  expect(html).toContain('摘'.repeat(240))
  expect(html).not.toContain('摘'.repeat(241))
  expect(html.match(/<ol /g)).toHaveLength(1)
  expect(html.match(/src="\/source-icons\//g)).toHaveLength(3)
  expect(html).toContain('>03</span>')
  expect(html).not.toContain('查看全部')
})

it('distinguishes an empty section from unavailable data', () => {
  const feeds = Object.fromEntries(
    aiSources.map((source) => [source.id, { state: 'empty' }])
  ) as Record<string, FeedResult>
  expect(
    renderToStaticMarkup(<SectionOverview basePath="/ai" sources={aiSources} feeds={feeds} />)
  ).toContain('暂无内容。')
  feeds.openai = { state: 'error' }
  const html = renderToStaticMarkup(
    <SectionOverview basePath="/ai" sources={aiSources} feeds={feeds} />
  )
  expect(html).toContain('role="alert"')
  expect(html).not.toContain('暂无内容。')
})
