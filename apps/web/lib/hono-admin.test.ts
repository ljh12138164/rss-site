import { beforeEach, expect, it, vi } from 'vitest'
import { app } from './hono-app'

const { getAdminDataClient, update, revalidatePath } = vi.hoisted(() => ({
  getAdminDataClient: vi.fn(),
  update: vi.fn(),
  revalidatePath: vi.fn()
}))
vi.mock('./admin-supabase', () => ({ getAdminDataClient }))
vi.mock('next/cache', () => ({ revalidatePath, revalidateTag: vi.fn() }))
vi.mock('next/server', () => ({ after: vi.fn() }))

const id = '550e8400-e29b-41d4-a716-446655440000'
const article = {
  id,
  section: 'news',
  source: 'xinhua',
  title: '修正标题',
  url: 'https://example.com/article',
  image_url: null,
  summary: '修正摘要',
  content_html: '<p>正文</p>',
  author: null,
  published_at: null,
  is_pinned: true,
  editorial_locked: true,
  first_seen_at: '2026-09-28T00:00:00Z'
}
const query = {
  update,
  eq: vi.fn(),
  select: vi.fn(),
  single: vi.fn()
}

beforeEach(() => {
  vi.clearAllMocks()
  getAdminDataClient.mockResolvedValue({ from: () => query })
  update.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.select.mockReturnValue(query)
  query.single.mockResolvedValue({ data: article, error: null })
})

const request = (body: unknown, token = 'valid') =>
  app.request(`/api/admin/articles/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

it('rejects a user without the server-assigned admin role', async () => {
  getAdminDataClient.mockResolvedValueOnce(null)
  const response = await request({
    title: 'Anything',
    summary: null,
    contentHtml: null,
    imageUrl: null,
    author: null,
    publishedAt: null,
    isPinned: false
  })
  expect(response.status).toBe(401)
  expect(update).not.toHaveBeenCalled()
})

it('rejects unsafe fields before writing', async () => {
  const response = await request({ ...article, source: 'openai' })
  expect(response.status).toBe(400)
  expect(update).not.toHaveBeenCalled()
})

it('saves only editorial fields, locks them against ingestion, and invalidates public pages', async () => {
  const response = await request({
    title: ' 修正标题 ',
    summary: '修正摘要',
    contentHtml: '<p>正文</p>',
    imageUrl: null,
    author: null,
    publishedAt: null,
    isPinned: true
  })
  expect(response.status).toBe(200)
  expect(update).toHaveBeenCalledWith({
    title: '修正标题',
    summary: '修正摘要',
    content_html: '<p>正文</p>',
    image_url: null,
    author: null,
    published_at: null,
    is_pinned: true,
    editorial_locked: true
  })
  expect(revalidatePath).toHaveBeenCalledWith('/news/xinhua')
  expect((await response.json()).article.id).toBe(id)
})

it('denies ingestion stats before calling the database and keeps the response private', async () => {
  getAdminDataClient.mockResolvedValueOnce(null)
  const response = await app.request('/api/admin/ingestion')
  expect(response.status).toBe(401)
  expect(response.headers.get('Cache-Control')).toBe('no-store')
})

it('reads aggregated metrics with the administrator token and hides database errors', async () => {
  const abortSignal = vi.fn().mockResolvedValue({
    data: [{ source: 'openai', sample_count: 100, body_count: 80 }],
    error: null
  })
  const rpc = vi.fn(() => ({ abortSignal }))
  getAdminDataClient.mockResolvedValue({ rpc })
  const response = await app.request('/api/admin/ingestion', {
    headers: { Authorization: 'Bearer admin-token' }
  })
  expect(response.status).toBe(200)
  expect(getAdminDataClient).toHaveBeenCalledWith('Bearer admin-token')
  expect(rpc).toHaveBeenCalledWith('get_ingestion_health')
  expect(await response.json()).toEqual({
    items: [{ source: 'openai', sample_count: 100, body_count: 80 }]
  })
  abortSignal.mockResolvedValueOnce({ data: null, error: { message: 'private secret' } })
  const failure = await app.request('/api/admin/ingestion')
  expect(failure.status).toBe(503)
  expect(await failure.text()).not.toContain('secret')
})
