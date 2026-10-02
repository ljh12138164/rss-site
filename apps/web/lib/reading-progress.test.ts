import { afterEach, expect, it, vi } from 'vitest'
import { estimateReadingMinutes, getReadingPosition, saveReadingPosition } from './reading-progress'

afterEach(() => vi.unstubAllGlobals())

it('estimates mixed-language reading time once from original text and handles empty bodies', () => {
  expect(estimateReadingMinutes('<p></p>')).toBeNull()
  expect(estimateReadingMinutes(`<h2>标题</h2><p>${'文'.repeat(700)}</p>`)).toBe(3)
  expect(estimateReadingMinutes(`<p>${'word '.repeat(400)}</p>`)).toBe(2)
  expect(estimateReadingMinutes('摘要')).toBe(1)
})

it('round-trips partial reading positions and rejects invalid or finished positions', () => {
  let stored = '{}'
  vi.stubGlobal('window', {
    localStorage: {
      getItem: () => stored,
      setItem: (_key: string, value: string) => {
        stored = value
      }
    }
  })
  expect(saveReadingPosition('article', 0.45)).toBe(true)
  expect(getReadingPosition('article')).toBe(0.45)
  expect(saveReadingPosition('article', Number.NaN)).toBe(false)
  expect(saveReadingPosition('article', 1.1)).toBe(true)
  expect(getReadingPosition('article')).toBeNull()
  stored = '{bad json'
  expect(getReadingPosition('article')).toBeNull()
  stored = JSON.stringify({ article: { ratio: 'bad' } })
  expect(getReadingPosition('article')).toBeNull()
})

it('bounds local storage to 100 positions and handles blocked storage', () => {
  let stored = '{}'
  vi.stubGlobal('window', {
    localStorage: {
      getItem: () => stored,
      setItem: (_key: string, value: string) => {
        stored = value
      }
    }
  })
  for (let index = 0; index < 110; index++) {
    vi.spyOn(Date, 'now').mockReturnValue(index)
    saveReadingPosition(`article-${index}`, 0.5)
  }
  vi.restoreAllMocks()
  expect(Object.keys(JSON.parse(stored))).toHaveLength(100)
  expect(getReadingPosition('article-0')).toBeNull()
  expect(getReadingPosition('article-109')).toBe(0.5)
  vi.stubGlobal('window', {
    localStorage: {
      getItem: () => null,
      setItem: () => {
        throw new Error('blocked')
      }
    }
  })
  expect(saveReadingPosition('article', 0.5)).toBe(false)
})
