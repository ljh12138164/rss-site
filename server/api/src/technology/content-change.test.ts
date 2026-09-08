import { expect, it } from 'vitest'
import { changedSourceKeys } from './content-change.js'

const previous = [
  {
    sourceKey: '1',
    title: 'A',
    url: 'https://example.com/a',
    summary: 'summary',
    author: null,
    publishedAt: new Date('2026-09-01'),
    position: 1,
    contentHtml: '<p>body</p>',
    imageUrl: null
  }
]
it('ignores an identical feed and preserves existing body when the new item has no body', () => {
  expect(changedSourceKeys(previous, previous)).toEqual([])
  expect(changedSourceKeys(previous, [{ ...previous[0], contentHtml: null }])).toEqual([])
})
it('detects changes to visible content, order, additions and removals', () => {
  expect(changedSourceKeys(previous, [{ ...previous[0], title: 'B' }])).toEqual(['1'])
  expect(changedSourceKeys(previous, [{ ...previous[0], contentHtml: '<p>new body</p>' }])).toEqual(
    ['1']
  )
  expect(changedSourceKeys(previous, [{ ...previous[0], position: 2 }])).toEqual(['1'])
  expect(changedSourceKeys(previous, [])).toEqual(['1'])
  expect(changedSourceKeys([], previous)).toEqual(['1'])
})
