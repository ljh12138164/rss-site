import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearReadingHistory,
  clearSavedArticles,
  getReadingHistory,
  getSavedArticles,
  isArticleRead,
  isArticleSaved,
  recordReadingHistory,
  removeReadingHistory,
  removeSavedArticle,
  saveArticle,
  toggleSavedArticle
} from './reading-list'

describe('reading-list storage', () => {
  const storageMap = new Map<string, string>()
  const mockLocalStorage = {
    getItem: (key: string) => storageMap.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storageMap.set(key, String(value))
    },
    removeItem: (key: string) => {
      storageMap.delete(key)
    },
    clear: () => {
      storageMap.clear()
    },
    length: 0,
    key: () => null
  }

  beforeEach(() => {
    storageMap.clear()
    global.window = {
      localStorage: mockLocalStorage,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true
    } as unknown as Window & typeof globalThis
    clearSavedArticles()
    clearReadingHistory()
  })

  it('saves, checks, and removes articles from read later', () => {
    expect(getSavedArticles()).toEqual([])
    expect(isArticleSaved('art-1')).toBe(false)

    saveArticle({
      id: 'art-1',
      title: 'DeepSeek R1 Released',
      url: 'https://example.com/art-1',
      source: 'openai',
      section: 'ai'
    })

    expect(isArticleSaved('art-1')).toBe(true)
    const saved = getSavedArticles()
    expect(saved).toHaveLength(1)
    expect(saved[0].title).toBe('DeepSeek R1 Released')
    expect(saved[0].savedAt).toBeGreaterThan(0)

    removeSavedArticle('art-1')
    expect(isArticleSaved('art-1')).toBe(false)
    expect(getSavedArticles()).toHaveLength(0)
  })

  it('toggles read later status', () => {
    const item = {
      id: 'art-2',
      title: 'Anthropic Claude 3.7',
      url: 'https://example.com/art-2'
    }

    const state1 = toggleSavedArticle(item)
    expect(state1).toBe(true)
    expect(isArticleSaved('art-2')).toBe(true)

    const state2 = toggleSavedArticle(item)
    expect(state2).toBe(false)
    expect(isArticleSaved('art-2')).toBe(false)
  })

  it('clears all saved articles', () => {
    saveArticle({ id: 'art-1', title: 'A', url: '/a' })
    saveArticle({ id: 'art-2', title: 'B', url: '/b' })
    expect(getSavedArticles()).toHaveLength(2)

    clearSavedArticles()
    expect(getSavedArticles()).toHaveLength(0)
  })

  it('records, checks, and caps reading history with LRU order', () => {
    expect(getReadingHistory()).toEqual([])
    expect(isArticleRead('art-10')).toBe(false)

    recordReadingHistory({
      id: 'art-10',
      title: 'Article 10',
      url: '/10'
    })

    expect(isArticleRead('art-10')).toBe(true)
    expect(getReadingHistory()).toHaveLength(1)

    // Re-visiting moves to front
    recordReadingHistory({
      id: 'art-20',
      title: 'Article 20',
      url: '/20'
    })
    recordReadingHistory({
      id: 'art-10',
      title: 'Article 10',
      url: '/10'
    })

    const history = getReadingHistory()
    expect(history[0].id).toBe('art-10')
    expect(history[1].id).toBe('art-20')

    removeReadingHistory('art-20')
    expect(isArticleRead('art-20')).toBe(false)
    expect(getReadingHistory()).toHaveLength(1)

    clearReadingHistory()
    expect(getReadingHistory()).toHaveLength(0)
  })
})
