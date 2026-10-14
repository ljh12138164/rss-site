import { expect, it, vi } from 'vitest'
import { populateSkillDetail } from './skill-preview-detail.mjs'

it.each(['mattpocock/skills/tdd', 'example.com/tdd'])(
  'loads the full snapshot for %s through the official API instead of guessing paths',
  async (id) => {
    const raw = '---\nname: tdd\n---\n# Test-driven development\nTest public behavior.'
    const detail = { skillId: id, skillMarkdown: null, contentHtml: null, detailState: 'missing' }
    const fetcher = vi.fn(async (url, init) => {
      expect(url).toBe(`https://www.skills.sh/api/v1/skills/${id}`)
      expect(init.headers.Authorization).toBe('Bearer test-token')
      return Response.json({
        id,
        installs: 100,
        hash: 'snapshot-hash',
        files: [{ path: 'SKILL.md', contents: raw }]
      })
    })
    await populateSkillDetail(detail, {
      token: 'test-token',
      fetcher,
      renderMarkdown: (text) => `<p>${text}</p>`,
      now: '2026-10-14T00:00:00Z'
    })
    expect(detail.skillMarkdown).toBe(raw)
    expect(detail.contentHtml).toContain('Test-driven development')
    expect(detail.totalInstalls).toBe(100)
    expect(detail.detailState).toBe('ready')
    expect(fetcher).toHaveBeenCalledTimes(1)
  }
)

it('distinguishes missing snapshots from authentication failures', async () => {
  const detail = { skillId: 'mattpocock/skills/tdd', detailState: 'missing' }
  await expect(
    populateSkillDetail(detail, {
      token: 'expired',
      fetcher: async () => new Response('', { status: 401 })
    })
  ).rejects.toThrow('Skills API 401')
  await expect(populateSkillDetail(detail, { token: '' })).rejects.toThrow('VERCEL_OIDC_TOKEN')
})
