import { beforeEach, expect, it, vi } from 'vitest'
import { warmListCaches } from './list-cache-prewarm'
import { listCacheTargets } from './list-cache-scopes'

const { articles, skills } = vi.hoisted(() => ({ articles: vi.fn(), skills: vi.fn() }))
vi.mock('./home-articles', () => ({ getHomeArticles: articles }))
vi.mock('./hot-feed', () => ({ getSectionFeeds: skills }))

beforeEach(() => {
  vi.resetAllMocks()
})

it('actively refreshes every registered list with at most two database fills in flight', async () => {
  let active = 0
  let maximum = 0
  const fill = async () => {
    active++
    maximum = Math.max(maximum, active)
    await new Promise((resolve) => setTimeout(resolve, 1))
    active--
  }
  articles.mockImplementation(fill)
  skills.mockImplementation(fill)
  const result = await warmListCaches()
  expect(result).toEqual({
    total: listCacheTargets().length,
    succeeded: listCacheTargets().length,
    failed: []
  })
  expect(maximum).toBe(2)
  expect(articles.mock.calls.every((call) => call[0] === null && call[3] === true)).toBe(true)
  expect(skills).toHaveBeenCalledWith('skills', undefined, undefined, true)
})

it('reports failed scopes independently so a retry does not reread healthy lists', async () => {
  articles.mockRejectedValueOnce(new Error('private-database-url')).mockResolvedValue({})
  const result = await warmListCaches(['source:zhihu', 'section:social'])
  expect(result.failed).toEqual(['section:social'])
  expect(JSON.stringify(result)).not.toContain('private-database-url')
  expect(await warmListCaches(result.failed)).toEqual({ total: 1, succeeded: 1, failed: [] })
  expect(articles).toHaveBeenCalledTimes(3)
})

it('stops scheduling new reads after the deployment deadline', async () => {
  const deadline = new AbortController()
  deadline.abort()
  const result = await warmListCaches(['section:ai', 'source:zhihu'], deadline.signal)
  expect(result).toEqual({ total: 2, succeeded: 0, failed: ['section:ai', 'source:zhihu'] })
  expect(articles).not.toHaveBeenCalled()
  expect(skills).not.toHaveBeenCalled()
})
