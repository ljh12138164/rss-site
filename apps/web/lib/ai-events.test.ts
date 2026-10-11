import { afterEach, expect, it, vi } from 'vitest'
import { getEventPage } from './ai-events'

const { readLinks } = vi.hoisted(() => ({ readLinks: vi.fn() }))
vi.mock('./supabase', () => ({
  getPublicSupabaseClient: () => ({
    from: (table: string) => {
      const query = {
        select: () => query,
        eq: () => query,
        lte: () => query,
        order: () => query,
        limit: () => query,
        in: (_key: string, ids: string[]) => {
          readLinks(ids)
          return query
        },
        // biome-ignore lint/suspicious/noThenProperty: Supabase query builders are intentionally thenable.
        then: (resolve: (value: unknown) => unknown) =>
          resolve(
            table === 'ai_events'
              ? {
                  data: Array.from({ length: 21 }, (_, i) => ({
                    id: `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`,
                    title: '事件',
                    slug: `event-${i}`,
                    summary: '摘要',
                    occurred_at: '2026-10-01T00:00:00Z'
                  })),
                  error: null
                }
              : {
                  data: [
                    {
                      event_id: '550e8400-e29b-41d4-a716-000000000000',
                      signal_articles: { source: 'openai' }
                    },
                    {
                      event_id: '550e8400-e29b-41d4-a716-000000000000',
                      signal_articles: { source: 'simon-willison' }
                    },
                    {
                      event_id: '550e8400-e29b-41d4-a716-000000000000',
                      signal_articles: { source: 'openai' }
                    }
                  ],
                  error: null
                }
          )
      }
      return query
    }
  })
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
