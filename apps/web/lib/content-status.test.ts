import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getContentStatus } from './content-status'

const { from } = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('./supabase', () => ({ getPublicSupabaseClient: () => ({ from }) }))
vi.mock('next/cache', () => ({ unstable_cache: (fn: () => unknown) => fn }))

type Result = { data: { id?: string; key?: string } | null; error: unknown }
const visible: Result = { data: { id: 'article-id' }, error: null }
const absent: Result = { data: null, error: null }
function query(result: Promise<Result>) {
  const chain = {
    select: () => chain,
    eq: vi.fn(() => chain),
    abortSignal: () => chain,
    maybeSingle: () => result
  }
  return chain
}
beforeEach(() => vi.clearAllMocks())

describe('content visibility precheck', () => {
  it('starts visibility and tombstone reads together on a cold request', async () => {
    let release: ((result: Result) => void) | undefined
    const removed = new Promise<Result>((resolve) => {
      release = resolve
    })
    from.mockImplementation((table) =>
      query(table === 'content_tombstones' ? removed : Promise.resolve(visible))
    )
    const pending = getContentStatus('news', 'article-id', 'juejin')
    const started = from.mock.calls.map(([table]) => table)
    release?.(absent)
    await expect(pending).resolves.toBe(200)
    expect(started).toEqual(['content_tombstones', 'signal_articles'])
  })

  it('keeps tombstone precedence even if the article still exists or its read fails', async () => {
    for (const result of [visible, { data: null, error: { message: 'unavailable' } }]) {
      from.mockImplementation((table) =>
        query(
          Promise.resolve(
            table === 'content_tombstones'
              ? { data: { key: 'juejin/article-id' }, error: null }
              : result
          )
        )
      )
      await expect(getContentStatus('news', 'article-id', 'juejin')).resolves.toBe(410)
    }
  })

  it('returns 404 for a missing article and fails closed on either database error', async () => {
    from.mockImplementation(() => query(Promise.resolve(absent)))
    await expect(getContentStatus('news', 'article-id', 'juejin')).resolves.toBe(404)
    for (const failingTable of ['content_tombstones', 'signal_articles']) {
      from.mockImplementation((table) =>
        query(
          Promise.resolve(
            table === failingTable
              ? { data: null, error: { message: 'unavailable' } }
              : table === 'content_tombstones'
                ? absent
                : visible
          )
        )
      )
      await expect(getContentStatus('news', 'article-id', 'juejin')).rejects.toThrow(
        'Content status unavailable'
      )
    }
  })

  it('still checks event publication status', async () => {
    const event = query(Promise.resolve(visible))
    from.mockImplementation((table) =>
      table === 'ai_events' ? event : query(Promise.resolve(absent))
    )
    await expect(getContentStatus('event', 'event-slug', 'events')).resolves.toBe(200)
    expect(event.eq).toHaveBeenCalledWith('status', 'published')
  })
})
