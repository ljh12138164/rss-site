import { describe, expect, it } from 'vitest'
import { resolveRevalidation } from './revalidate-paths'

describe('resolveRevalidation', () => {
  it('invalidates daily latest, dated issue, all archive-bearing pages and sitemap only', () => {
    expect(resolveRevalidation({ dailyReportDate: '2026-11-04' })).toEqual({
      paths: ['/daily', '/daily/2026-11-04', '/sitemap.xml'],
      dynamicPages: ['/daily/[date]'],
      tags: ['daily-reports', 'sitemap']
    })
    expect(() => resolveRevalidation({ dailyReportDate: '2026-02-30' })).toThrow()
    expect(() => resolveRevalidation({ dailyReportDate: '2026-11-04', source: 'openai' })).toThrow()
  })
  it('resolves standard section and source paths', () => {
    const result = resolveRevalidation({ section: '/news', source: 'xinhua' })
    expect(result.paths).toEqual(['/', '/latest', '/sitemap.xml', '/news', '/news/xinhua'])
    expect(result.dynamicPages).toEqual(['/news/xinhua/[slug]'])
    expect(result.tags).toEqual(['sitemap', 'news-status:xinhua'])
  })

  it('special-cases github ranking paths', () => {
    const result = resolveRevalidation({ section: '/technology', source: 'github' })
    expect(result.paths).toEqual(['/', '/latest', '/sitemap.xml', '/github'])
    expect(result.dynamicPages).toEqual([])
    expect(result.tags).toEqual(['sitemap', 'news-status:github'])
  })

  it('special-cases skills section paths', () => {
    const result = resolveRevalidation({ section: '/skills', source: 'skills-all-time' })
    expect(result.paths).toEqual(['/', '/latest', '/sitemap.xml', '/skills'])
    expect(result.dynamicPages).toEqual(['/skills/[...skillId]'])
    expect(result.tags).toEqual(['sitemap', 'news-status:skills-all-time'])
  })

  it('includes event timeline and slug paths when events or ai section specified', () => {
    const result = resolveRevalidation({
      section: '/ai',
      source: 'openai',
      eventSlugs: ['gpt-5-announcement']
    })
    expect(result.paths).toContain('/ai/events')
    expect(result.paths).toContain('/ai/events/gpt-5-announcement')
    expect(result.dynamicPages).toContain('/ai/events/[slug]')
    expect(result.dynamicPages).toContain('/ai/openai/[slug]')
    expect(result.tags).toContain('event-status')
    expect(result.tags).toContain('news-status:openai')
  })

  it('invalidates concrete Skill details including entries removed from a ranking', () => {
    const result = resolveRevalidation({
      section: '/skills',
      source: 'skills-trending',
      skillIds: ['mattpocock/skills/tdd', 'open.feishu.cn/lark-doc', 'mattpocock/skills/tdd']
    })
    expect(result.paths).toEqual([
      '/',
      '/latest',
      '/sitemap.xml',
      '/skills',
      '/skills/mattpocock/skills/tdd',
      '/skills/open.feishu.cn/lark-doc'
    ])
    expect(() => resolveRevalidation({ skillIds: ['owner/../bad'] })).toThrow('Invalid Skill ID')
  })
})
