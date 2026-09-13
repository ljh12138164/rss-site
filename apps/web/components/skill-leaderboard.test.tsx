import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { SkillFeeds } from '../lib/hot-feed'
import { parseSkillMetadata, SkillLeaderboard } from './skill-leaderboard'

const feeds: SkillFeeds = {
  'skills-trending': {
    state: 'ready',
    status: { itemCount: 1, lastSuccessAt: new Date('2026-09-14T01:00:00.000Z') },
    items: [
      {
        sourceKey: 'owner/repo/example',
        title: '#1 example-skill',
        url: 'https://www.skills.sh/owner/repo/example-skill',
        summary: 'Helps with examples. · Installs: 1,234 · Source: owner/repo',
        author: 'owner',
        publishedAt: null,
        position: 1
      }
    ]
  },
  'skills-hot': { state: 'empty' }
}

describe('SkillLeaderboard', () => {
  it('renders accessible ranking tabs and skill metadata', () => {
    const html = renderToStaticMarkup(<SkillLeaderboard feeds={feeds} />)
    expect(html).toContain('最热门')
    expect(html).toContain('增长最快')
    expect(html).toContain('example-skill')
    expect(html).toContain('Helps with examples.')
    expect(html).toContain('1,234')
    expect(html).toContain('from=%2Fskills')
  })

  it('parses signed growth and tolerates missing metadata', () => {
    expect(
      parseSkillMetadata('Description · Installs: 20 · Hourly change: +4 · Source: owner/repo')
    ).toEqual({ description: 'Description', installs: 20, change: 4, source: 'owner/repo' })
    expect(parseSkillMetadata(null)).toEqual({
      description: null,
      installs: null,
      change: null,
      source: null
    })
  })
})
