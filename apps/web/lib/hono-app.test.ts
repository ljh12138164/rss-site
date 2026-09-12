import { beforeEach, describe, expect, it, vi } from 'vitest'
import { app } from './hono-app'

const { getNewsArticle, translateArticleOnce } = vi.hoisted(() => ({
  getNewsArticle: vi.fn(),
  translateArticleOnce: vi.fn()
}))

vi.mock('./signal-article', () => ({ getNewsArticle }))
vi.mock('./article-translation', () => ({
  translateArticleOnce,
  TranslationBusyError: class TranslationBusyError extends Error {}
}))

const id = '550e8400-e29b-41d4-a716-446655440000'

beforeEach(() => {
  vi.clearAllMocks()
  getNewsArticle.mockResolvedValue({ id })
  translateArticleOnce.mockResolvedValue({
    title: '中文标题',
    contentHtml: '<p>中文正文</p>',
    summary: null
  })
})

describe('Hono translation RPC', () => {
  it('validates input before loading an article', async () => {
    const response = await app.request('/api/articles/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'bad', source: 'openai' })
    })
    expect(response.status).toBe(400)
    expect(getNewsArticle).not.toHaveBeenCalled()
  })

  it('loads the server-owned article and returns its translation', async () => {
    const response = await app.request('/api/articles/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, source: 'openai' })
    })
    expect(response.status).toBe(200)
    expect(getNewsArticle).toHaveBeenCalledWith(id, 'openai')
    expect(await response.json()).toEqual({
      translation: { title: '中文标题', contentHtml: '<p>中文正文</p>', summary: null }
    })
  })

  it('returns a typed not-found response', async () => {
    getNewsArticle.mockResolvedValue(null)
    const response = await app.request('/api/articles/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, source: 'openai' })
    })
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: '文章不存在' })
  })
})
