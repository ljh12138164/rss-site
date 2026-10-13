import { getSignalSource } from '@rss-site/signals'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it, vi } from 'vitest'
import type { SignalArticle } from '../lib/signal-article'
import { ArticleReader } from './article-reader'

const keys = vi.hoisted(() => [] as string[])
vi.mock('./article-summary', () => ({
  ArticleSummary: ({ cacheKey }: { cacheKey: string }) => {
    keys.push(cacheKey)
    return null
  }
}))

it('invalidates local summaries when article content changes, but not when it is seen again', () => {
  const article: SignalArticle = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    source: 'xinhua',
    sourceKey: 'one',
    title: '文章标题',
    url: 'https://example.com/article',
    summary: '来源摘要'.repeat(50),
    contentHtml: `<p>${'原始正文'.repeat(50)}</p>`,
    author: null,
    publishedAt: null,
    firstSeenAt: new Date(0),
    lastSeenAt: new Date(0)
  }
  const render = (value: SignalArticle) =>
    renderToStaticMarkup(<ArticleReader article={value} source={getSignalSource('xinhua')} />)
  render(article)
  render({ ...article, lastSeenAt: new Date() })
  render({ ...article, contentHtml: `<p>${'修改正文'.repeat(50)}</p>` })
  render({ ...article, title: '修改标题' })
  render({ ...article, contentHtml: null })
  expect(keys[0]).toEqual(expect.any(String))
  expect(keys[1]).toBe(keys[0])
  expect(keys[2]).not.toBe(keys[0])
  expect(keys[3]).not.toBe(keys[0])
  expect(keys[4]).not.toBe(keys[0])
})
