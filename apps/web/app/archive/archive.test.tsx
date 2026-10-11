import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, expect, it, vi } from 'vitest'
import Page, { generateMetadata } from './[section]/[[...source]]/page'

const { read } = vi.hoisted(() => ({ read: vi.fn() }))
vi.mock('../../lib/home-articles', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/home-articles')>()),
  getHomeArticles: read
}))
vi.mock('next/navigation', () => ({
  usePathname: () => '/archive/news/xinhua',
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  notFound: () => {
    throw new Error('404')
  },
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`)
  }
}))
const cursor = JSON.stringify({
  id: '550e8400-e29b-41d4-a716-446655440000',
  publishedAt: '2026-10-01T00:00:00Z',
  snapshot: '2026-10-02T00:00:00Z'
})
const props = (value: string | string[] = cursor) => ({
  params: Promise.resolve({ section: 'news', source: ['xinhua'] }),
  searchParams: Promise.resolve({ cursor: value })
})
afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
})

it('renders historical articles and a real next-page URL with its own canonical', async () => {
  vi.stubEnv('SITE_URL', 'https://news.ljhboard.cn')
  read.mockResolvedValue({
    items: [
      {
        articleId: '550e8400-e29b-41d4-a716-446655440001',
        sourceKey: 'article-1',
        title: '真实历史文章',
        url: 'https://example.com/original',
        summary: null,
        publishedAt: '2026-09-30T00:00:00Z',
        position: 1
      }
    ],
    nextCursor: cursor
  })
  const html = renderToStaticMarkup(await Page(props()))
  expect(html).toContain('真实历史文章')
  expect(html).toContain('/archive/news/xinhua?cursor=')
  expect(html).toContain('下一页')
  const metadata = await generateMetadata(props())
  expect(metadata.alternates?.canonical).toBe(
    `https://news.ljhboard.cn/archive/news/xinhua?cursor=${encodeURIComponent(cursor)}`
  )
})

it('rejects invalid cursors and sources before reading articles', async () => {
  await expect(Page(props('invalid'))).rejects.toThrow('404')
  await expect(Page(props([cursor, cursor]))).rejects.toThrow('404')
  await expect(
    Page({ ...props(), params: Promise.resolve({ section: 'news', source: ['openai'] }) })
  ).rejects.toThrow('404')
  expect(read).not.toHaveBeenCalled()
})
