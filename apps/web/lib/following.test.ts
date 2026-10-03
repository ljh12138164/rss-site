import { afterEach, expect, it, vi } from 'vitest'
import { articleQueryKey } from './article-query'
import { getFollowing, parseFollowing, saveFollowing } from './following'
import { parseArticleFilter } from './home-articles'

afterEach(() => vi.unstubAllGlobals())

it('validates stored preferences and lets hiding override following', () => {
  expect(
    parseFollowing({
      followed: ['openai', 'openai', 'github', 'invalid'],
      hidden: ['openai'],
      unreadOnly: 'yes'
    })
  ).toEqual({ followed: [], hidden: ['openai'], unreadOnly: false })
  expect(parseFollowing(null).followed).toEqual([])
})

it('persists preferences and signals same-tab updates without claiming a failed save succeeded', () => {
  const storage = new Map<string, string>()
  const dispatchEvent = vi.fn()
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (key: string) => storage.get(key),
      setItem: (key: string, value: string) => storage.set(key, value)
    },
    dispatchEvent
  })
  expect(saveFollowing({ followed: ['openai'], hidden: [], unreadOnly: true })).toBe(true)
  expect(getFollowing()).toEqual({ followed: ['openai'], hidden: [], unreadOnly: true })
  expect(dispatchEvent).toHaveBeenCalledOnce()
  vi.stubGlobal('window', {
    localStorage: {
      setItem: () => {
        throw new Error('denied')
      }
    }
  })
  expect(saveFollowing({ followed: [], hidden: [], unreadOnly: false })).toBe(false)
  expect(getFollowing().followed).toEqual(['openai'])
})

it('rejects unknown, non-article and cross-section sources before querying, and canonicalizes cache keys', () => {
  expect(parseArticleFilter('/ai', null, 'openai,anthropic,openai').sources).toEqual([
    'anthropic',
    'openai'
  ])
  for (const selected of ['invalid', 'github', 'juejin', ''])
    expect(() => parseArticleFilter('/ai', null, selected)).toThrow()
  expect(() => parseArticleFilter(null, 'openai', 'anthropic')).toThrow()
  expect(articleQueryKey({ sources: ['openai', 'anthropic'] })).toEqual(
    articleQueryKey({ sources: ['anthropic', 'openai'] })
  )
  expect(articleQueryKey({ sources: ['openai'] })).not.toEqual(articleQueryKey({}))
})
