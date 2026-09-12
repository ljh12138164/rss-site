import { beforeEach, describe, expect, it, vi } from 'vitest'
import { app } from './hono-app'

const { getEvent, getNewsArticle, translateArticleOnce, translateEventOnce } = vi.hoisted(() => ({
  getEvent: vi.fn(),
  getNewsArticle: vi.fn(),
  translateArticleOnce: vi.fn(),
  translateEventOnce: vi.fn()
}))

vi.mock('./ai-events', () => ({
  getEvent,
  validEventSlug: (slug: string) => slug.length <= 200 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}))
vi.mock('./signal-article', () => ({ getNewsArticle }))
vi.mock('./article-translation', () => ({
  translateArticleOnce,
  translateEventOnce,
  TranslationBusyError: class TranslationBusyError extends Error {}
}))

const id = '550e8400-e29b-41d4-a716-446655440000'

beforeEach(() => {
  vi.clearAllMocks()
  getNewsArticle.mockResolvedValue({ id })
  getEvent.mockResolvedValue({ id, slug: 'openai-launches-gpt-5' })
  translateArticleOnce.mockResolvedValue({
    title: '中文标题',
    contentHtml: '<p>中文正文</p>',
    summary: null
  })
  translateEventOnce.mockResolvedValue({
    title: 'OpenAI 发布 GPT-5',
    summary: 'OpenAI 发布了新的旗舰模型。'
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

  it('loads the server-owned event and returns its translation', async () => {
    const response = await app.request('/api/events/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'openai-launches-gpt-5' })
    })
    expect(response.status).toBe(200)
    expect(getEvent).toHaveBeenCalledWith('openai-launches-gpt-5')
    expect(await response.json()).toEqual({
      translation: {
        title: 'OpenAI 发布 GPT-5',
        summary: 'OpenAI 发布了新的旗舰模型。'
      }
    })
  })

  it('validates an event slug before loading the event', async () => {
    const response = await app.request('/api/events/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: '../private' })
    })
    expect(response.status).toBe(400)
    expect(getEvent).not.toHaveBeenCalled()
  })
})
