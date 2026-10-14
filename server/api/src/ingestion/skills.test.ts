import { describe, expect, it } from 'vitest'
import { readSkillJsonFeed, skillInstallCommand, skillPath } from '../../../../shared/skills.js'
import { parseSignalFeed } from './feed.js'

const entry = {
  id: 'anthropics/skills/frontend-design',
  title: '#1 frontend-design',
  url: 'https://skills.sh/anthropics/skills/frontend-design',
  summary: 'Design interfaces.',
  content_text: '# Design',
  content_html: '<h1>Design</h1>',
  _extra: {
    skills: {
      version: 1,
      source: 'anthropics/skills',
      sourceType: 'github',
      installUrl: 'https://github.com/anthropics/skills',
      installs: 20,
      totalInstalls: 1000,
      state: 'ready'
    }
  }
}

describe('Skills detail contract', () => {
  it('keeps ranking-window counts separate from lifetime installs and preserves complete content', () => {
    const items = parseSignalFeed(JSON.stringify({ items: [entry] }), 'Skills', {
      skillMetadata: true
    })
    expect(items[0].summary).toContain('Installs: 20')
    expect(items[0].skillDetail?.totalInstalls).toBe(1000)
    expect(items[0].skillDetail?.skillMarkdown).toBe('# Design')
    expect(items[0].author).toBe('anthropics')
  })
  it('rejects invalid identifiers and source mismatches', () => {
    expect(skillPath('owner/../skill')).toBeNull()
    expect(skillPath('owner/repo/a%2Fb')).toBeNull()
    expect(skillPath('mintlify.com/mintlify')).toBe('/skills/mintlify.com/mintlify')
    expect(() =>
      readSkillJsonFeed(JSON.stringify({ items: [{ ...entry, id: 'another/repo/skill' }] }))
    ).toThrow('Invalid Skills source')
  })
  it('does not generate executable shell fragments from untrusted install URLs', () => {
    expect(
      skillInstallCommand({
        skillId: entry.id,
        installUrl: 'https://github.com/anthropics/skills;echo'
      })
    ).toBeNull()
    expect(
      skillInstallCommand({ skillId: entry.id, installUrl: 'https://github.com/anthropics/skills' })
    ).toBe('npx skills add https://github.com/anthropics/skills --skill frontend-design')
  })
  it('keeps absent counts absent and recognizes missing snapshots', () => {
    const [item] = readSkillJsonFeed(
      JSON.stringify({
        items: [
          {
            ...entry,
            content_text: null,
            _extra: {
              skills: { ...entry._extra.skills, installs: 0, totalInstalls: null, state: 'missing' }
            }
          }
        ]
      })
    )
    expect(item.installs).toBe(0)
    expect(item.detail.totalInstalls).toBeNull()
    expect(item.detail.skillMarkdown).toBeNull()
    expect(item.detail.detailState).toBe('missing')
  })

  it('does not mistake the JSON Feed serializer title fallback for SKILL.md', () => {
    const [item] = readSkillJsonFeed(
      JSON.stringify({
        items: [
          {
            ...entry,
            content_text: entry.title,
            content_html: '',
            _extra: { skills: { ...entry._extra.skills, state: 'missing' } }
          }
        ]
      })
    )
    expect(item.detail.skillMarkdown).toBeNull()
    expect(item.detail.detailState).toBe('missing')
  })
})
