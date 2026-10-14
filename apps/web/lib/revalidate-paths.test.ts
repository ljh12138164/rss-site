import { describe, expect, it } from 'vitest'
import { resolveRevalidation } from './revalidate-paths'

describe('resolveRevalidation', () => {
  it('resolves standard section and source paths', () => {
    const result = resolveRevalidation({ section: '/news', source: 'xinhua' })
    expect(result.paths).toEqual(['/', '/sitemap.xml', '/news', '/news/xinhua'])
    expect(result.dynamicPages).toEqual(['/news/xinhua/[slug]'])
    expect(result.tags).toEqual(['sitemap', 'news-status:xinhua'])
  })

  it('special-cases github ranking paths', () => {
    const result = resolveRevalidation({ section: '/technology', source: 'github' })
    expect(result.paths).toEqual(['/', '/sitemap.xml', '/github'])
    expect(result.dynamicPages).toEqual([])
    expect(result.tags).toEqual(['sitemap', 'news-status:github'])
  })

  it('special-cases skills section paths', () => {
    const result = resolveRevalidation({ section: '/skills', source: 'skills-all-time' })
    expect(result.paths).toEqual(['/', '/sitemap.xml', '/skills'])
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
})
