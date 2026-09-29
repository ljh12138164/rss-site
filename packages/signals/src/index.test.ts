import { describe, expect, it } from 'vitest'
import {
  aiSources,
  financeSources,
  gameSources,
  getSignalSection,
  getSignalSource,
  isSignalSectionId,
  isSignalSourceId,
  listSignalSections,
  listSignalSources,
  newsSources,
  resolveSignalFeedUrl,
  SIGNAL_CRON_JOBS,
  signalSections,
  signalSources,
  skillSources,
  socialSources,
  technologyArticleSources,
  technologySources
} from './index.js'

describe('@rss-site/signals', () => {
  it('defines 7 sections and 41 sources', () => {
    expect(signalSections).toHaveLength(7)
    expect(listSignalSections()).toHaveLength(7)
    expect(signalSources).toHaveLength(41)
    expect(SIGNAL_CRON_JOBS).toHaveLength(41)
  })

  it('correctly maps all section counts', () => {
    expect(technologySources).toHaveLength(7)
    expect(technologyArticleSources).toHaveLength(6)
    expect(skillSources).toHaveLength(2)
    expect(newsSources).toHaveLength(6)
    expect(aiSources).toHaveLength(9)
    expect(socialSources).toHaveLength(6)
    expect(financeSources).toHaveLength(5)
    expect(gameSources).toHaveLength(6)
  })

  it('retrieves source and section by id', () => {
    const gh = getSignalSource('github')
    expect(gh.name).toBe('GitHub Trending')
    expect(gh.isArticle).toBe(false)
    expect(gh.section).toBe('technology')

    const tech = getSignalSection('technology')
    expect(tech.title).toBe('科技')
    expect(tech.path).toBe('/technology')

    expect(() => getSignalSource('nonexistent')).toThrow('Unknown signal source')
    expect(() => getSignalSection('nonexistent')).toThrow('Unknown signal section')
  })

  it('validates source and section ids', () => {
    expect(isSignalSourceId('openai')).toBe(true)
    expect(isSignalSourceId('geekpark')).toBe(true)
    expect(isSignalSourceId('lilian-weng')).toBe(true)
    expect(isSignalSourceId('simon-willison')).toBe(true)
    expect(isSignalSourceId('chuapp')).toBe(true)
    expect(isSignalSourceId('invalid')).toBe(false)
    expect(isSignalSectionId('ai')).toBe(true)
    expect(isSignalSectionId('invalid')).toBe(false)
  })

  it('filters sources by section and isArticle', () => {
    const techArticles = listSignalSources({ section: 'technology', isArticle: true })
    expect(techArticles).toHaveLength(6)
    expect(techArticles.some((s) => s.id === 'github')).toBe(false)

    const allSkills = listSignalSources({ section: 'skills' })
    expect(allSkills).toHaveLength(2)
  })

  it('resolves feed urls correctly', () => {
    const rsshubSource = getSignalSource('hacker-news')
    expect(resolveSignalFeedUrl(rsshubSource, 'https://rsshub.app')).toBe(
      'https://rsshub.app/hackernews'
    )

    const directSource = getSignalSource('github-blog')
    expect(resolveSignalFeedUrl(directSource, 'https://rsshub.app')).toBe(
      'https://github.blog/feed/'
    )
  })

  it('ensures every cron job has valid format and non-empty schedule', () => {
    for (const job of SIGNAL_CRON_JOBS) {
      expect(job.name).toMatch(/^signal-ingest-[a-z0-9-]+$/)
      expect(job.schedule.split(' ')).toHaveLength(5)
    }
  })
})
