import { expect, it } from 'vitest'
import type { FeedResult } from './hot-feed'
import { searchSkillFeed } from './skill-search'

const feed: FeedResult = {
  state: 'ready',
  status: { itemCount: 2, lastSuccessAt: new Date('2026-10-14T00:00:00Z') },
  items: [
    {
      sourceKey: 'anthropics/skills/frontend-design',
      title: '#9 frontend-design',
      url: 'https://skills.sh/anthropics/skills/frontend-design',
      summary: 'Design interfaces. · Installs: 99 · Source: anthropics/skills',
      author: 'anthropics',
      publishedAt: null,
      position: 9
    },
    {
      sourceKey: 'owner/repo/search',
      title: '搜索技能',
      url: 'https://skills.sh/owner/repo/search',
      summary: '全文检索 · Source: owner/repo',
      author: 'owner',
      publishedAt: null,
      position: 15
    }
  ]
}
it('matches names, descriptions and sources case-insensitively without changing ranks', () => {
  for (const query of [
    'FRONTEND',
    'interfaces',
    'anthropics',
    'ｆｒｏｎｔｅｎｄ',
    'frontend anthropics'
  ]) {
    const result = searchSkillFeed(feed, query)
    expect(result.state === 'ready' && result.items.map((item) => item.position)).toEqual([9])
  }
  expect(
    searchSkillFeed(feed, '搜索').state === 'ready' &&
      (searchSkillFeed(feed, '搜索') as Extract<FeedResult, { state: 'ready' }>).items[0].position
  ).toBe(15)
  expect(feed.items.length).toBe(2)
})
it('resets whitespace-only searches and preserves source failures and empty states', () => {
  expect(searchSkillFeed(feed, '  ')).toBe(feed)
  expect(searchSkillFeed({ state: 'error' }, 'design')).toEqual({ state: 'error' })
  expect(searchSkillFeed({ state: 'empty' }, 'design')).toEqual({ state: 'empty' })
  const result = searchSkillFeed(feed, 'not-a-skill')
  expect(result.state === 'ready' && result.items).toEqual([])
})
