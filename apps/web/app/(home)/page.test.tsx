import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { QueryProvider } from '../../components/query-provider'
import type { HomeArticlePage } from '../../lib/home-articles'
import { aiSources, newsSources } from '../../lib/technology-sources'
import { HomeView } from './page'

const initialPage: HomeArticlePage = {
  items: [
    {
      articleId: '11111111-1111-4111-8111-111111111111',
      sourceKey: 'news',
      title: '最新新闻',
      url: 'https://example.com/news',
      summary: '新闻摘要',
      author: null,
      publishedAt: '2026-09-07T00:00:00Z',
      position: 1,
      section: '/news',
      platform: newsSources[0]
    },
    {
      articleId: '22222222-2222-4222-8222-222222222222',
      sourceKey: 'ai',
      title: '模型动态',
      url: 'https://example.com/ai',
      summary: null,
      author: null,
      publishedAt: '2026-09-06T00:00:00Z',
      position: 2,
      section: '/ai',
      platform: aiSources[0]
    }
  ],
  nextCursor: 'next-page'
}

it('renders a single cross-section article list and continuation control', () => {
  const html = renderToStaticMarkup(
    <QueryProvider>
      <HomeView initialPage={initialPage} />
    </QueryProvider>
  )
  expect(html.match(/<ol /g)).toHaveLength(1)
  expect(html.indexOf('最新新闻')).toBeLessThan(html.indexOf('模型动态'))
  expect(html).toContain('>02</span>')
  expect(html).toContain('加载更多')
  expect(html).toContain('href="/news/xinhua/最新新闻--11111111-1111-4111-8111-111111111111"')
  expect(html).toContain('href="/ai/openai"')
  expect(html).toContain('href="/github"')
})

it('distinguishes an empty list from a failed initial request', () => {
  const empty = { items: [], nextCursor: null }
  expect(
    renderToStaticMarkup(
      <QueryProvider>
        <HomeView initialPage={empty} />
      </QueryProvider>
    )
  ).toContain('暂无内容。')
  const html = renderToStaticMarkup(
    <QueryProvider>
      <HomeView initialPage={empty} initialError />
    </QueryProvider>
  )
  expect(html).toContain('重试')
  expect(html).toContain('role="alert"')
})
