import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getNewsArticle, getSameSourceArticles, type SignalArticle } from '../lib/signal-article'
import { renderArticlePage } from './article-reader'

vi.mock('../lib/signal-article', () => ({
  getNewsArticle: vi.fn(),
  getSameSourceArticles: vi.fn()
}))
vi.mock('./article-translation', () => ({ ArticleTranslation: () => null }))
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  }
}))
const id = '550e8400-e29b-41d4-a716-446655440000'
const article: SignalArticle = {
  id,
  source: 'juejin',
  sourceKey: 'story',
  title: '文章',
  url: 'https://juejin.cn/post/story',
  summary: null,
  author: null,
  publishedAt: null,
  firstSeenAt: new Date(0),
  lastSeenAt: new Date(0)
}
const props = () => ({ params: Promise.resolve({ source: 'juejin', slug: `story--${id}` }) })
beforeEach(() => vi.clearAllMocks())

describe('cold article data loading', () => {
  it('starts related articles while the primary article query is still pending', async () => {
    let release: ((article: SignalArticle) => void) | undefined
    vi.mocked(getNewsArticle).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve
        })
    )
    vi.mocked(getSameSourceArticles).mockResolvedValueOnce([])
    const pending = renderArticlePage(props(), 'technology')
    await vi.waitFor(() => expect(getNewsArticle).toHaveBeenCalled())
    const relatedStarted = vi.mocked(getSameSourceArticles).mock.calls.length
    release?.(article)
    await expect(pending).resolves.toBeDefined()
    expect(relatedStarted).toBe(1)
  })

  it('keeps the article available when the optional related query fails', async () => {
    vi.mocked(getNewsArticle).mockResolvedValueOnce(article)
    vi.mocked(getSameSourceArticles).mockRejectedValueOnce(new Error('unavailable'))
    const page = await renderArticlePage(props(), 'technology')
    expect(page.props.article).toEqual(article)
    expect(page.props.related).toEqual([])
  })

  it('rejects invalid source/section pairs before either database query starts', async () => {
    await expect(renderArticlePage(props(), 'finance')).rejects.toThrow('NEXT_NOT_FOUND')
    expect(getNewsArticle).not.toHaveBeenCalled()
    expect(getSameSourceArticles).not.toHaveBeenCalled()
  })
})
