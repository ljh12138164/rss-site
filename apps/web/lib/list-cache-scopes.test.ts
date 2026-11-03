import { listSignalSources, signalSections } from '@rss-site/signals'
import { expect, it } from 'vitest'
import { affectedListScopes, articleListScope, listCacheTargets } from './list-cache-scopes'

it('covers every public classification and platform once, with shared Skills rankings', () => {
  const targets = listCacheTargets()
  expect(new Set(targets.map((target) => target.scope)).size).toBe(targets.length)
  for (const section of signalSections.filter((section) => section.hasArticles))
    expect(targets.some((target) => target.scope === `section:${section.id}`)).toBe(true)
  for (const source of listSignalSources().filter((source) => source.section !== 'skills'))
    expect(targets.some((target) => target.scope === `source:${source.id}`)).toBe(true)
  expect(targets.filter((target) => target.scope === 'skills')).toHaveLength(1)
})

it('canonicalizes single-source requests and excludes personalized combinations', () => {
  expect(articleListScope({ source: 'zhihu' })).toBe(
    articleListScope({ section: '/social', source: 'zhihu' })
  )
  expect(articleListScope({ section: '/ai', source: 'zhihu' })).toBeNull()
  expect(articleListScope({ section: '/social', sources: ['zhihu'] })).toBeNull()
  expect(articleListScope({})).toBeNull()
})

it('refreshes only the changed platform and its classification, with ranking exceptions', () => {
  expect(affectedListScopes({ section: '/social', source: 'zhihu' })).toEqual([
    'source:zhihu',
    'section:social'
  ])
  expect(affectedListScopes({ section: '/technology', source: 'github' })).toEqual([
    'source:github'
  ])
  expect(affectedListScopes({ section: '/skills', skillIds: ['a/b/c'] })).toEqual(['skills'])
  expect(affectedListScopes({ eventSlugs: ['launch'] })).toEqual([])
})
