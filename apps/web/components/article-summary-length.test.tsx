import { getSignalSource } from '@rss-site/signals'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import type { SignalArticle } from '../lib/signal-article'
import { ArticleReader } from './article-reader'

const article: SignalArticle = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  source: 'xinhua',
  sourceKey: 'one',
  title: '很长的标题'.repeat(100),
  url: 'https://example.com',
  summary: '摘要'.repeat(200),
  contentHtml: null,
  author: null,
  publishedAt: null,
  firstSeenAt: new Date(0),
  lastSeenAt: new Date(0)
}
const render = (contentHtml: string | null, summary = article.summary) =>
  renderToStaticMarkup(
    <ArticleReader
      article={{ ...article, contentHtml, summary }}
      source={getSignalSource('xinhua')}
    />
  )
it('hides 199 characters, counts decoded text without whitespace, and permits exactly 200', () => {
  expect(render(`<p>${'中 '.repeat(199)}</p>`)).not.toContain('aria-label="AI 总结"')
  expect(render(`<p>${'中 '.repeat(200)}</p>`)).toContain('aria-label="AI 总结"')
  expect(render(`<p>${'&#20013;'.repeat(199)}</p>`)).not.toContain('aria-label="AI 总结"')
  expect(
    render(`<p>${'中'.repeat(190)}<a href="https://example.com/${'path'.repeat(30)}">link</a></p>`)
  ).not.toContain('aria-label="AI 总结"')
  expect(render(null)).toContain('aria-label="AI 总结"')
  expect(render('<script>ignored</script>', '短摘要')).not.toContain('aria-label="AI 总结"')
})
