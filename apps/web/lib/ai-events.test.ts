import { afterEach, expect, it, vi } from 'vitest'
import { getEventPage } from './ai-events'

const { readLinks } = vi.hoisted(() => ({ readLinks: vi.fn() }))
vi.mock('./business-queries', () => ({
  readEvents: async () =>
    Array.from({ length: 21 }, (_, i) => ({
      id: `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`,
      title: '事件',
      slug: `event-${i}`,
      summary: '摘要',
      occurred_at: '2026-10-01T00:00:00Z'
    })),
  readEventLinks: async (ids: string[]) => {
    readLinks(ids)
    return ['openai', 'simon-willison', 'openai'].map((source) => ({
      event_id: '550e8400-e29b-41d4-a716-000000000000',
      signal_articles: { source }
    }))
  }
}))

afterEach(() => vi.clearAllMocks())

it('loads publishers for the current page in one query and preserves pagination', async () => {
  const page = await getEventPage()
  expect(page.items).toHaveLength(20)
  expect(page.items[0].sources).toEqual(['openai', 'simon-willison'])
  expect(page.items[1].sources).toEqual([])
  expect(page.nextCursor).toBeTruthy()
  expect(readLinks).toHaveBeenCalledTimes(1)
  expect(readLinks.mock.calls[0][0]).toHaveLength(20)
})

it('rejects invalid cursors before querying event links', async () => {
  await expect(getEventPage('broken')).rejects.toThrow()
  expect(readLinks).not.toHaveBeenCalled()
})
