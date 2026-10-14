import { afterEach, expect, it, vi } from 'vitest'

vi.mock('./article-summary', async (original) => ({
  ...(await original<typeof import('./article-summary')>()),
  requestArticleSummary: vi.fn()
}))

import { requestArticleSummary, SummaryRequestError } from './article-summary'
import { app } from './hono-app'

const request = (body: unknown) =>
  app.request('/api/skills/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
afterEach(() => vi.clearAllMocks())
it('accepts only a stable Skill ID and uses the skill summary service', async () => {
  vi.mocked(requestArticleSummary).mockResolvedValue({
    overview: '用途说明',
    keyPoints: ['场景', '步骤', '限制'],
    basis: 'content'
  })
  expect((await request({ id: 'anthropics/skills/frontend-design' })).status).toBe(200)
  expect(requestArticleSummary).toHaveBeenCalledWith(
    'anthropics/skills/frontend-design',
    expect.any(AbortSignal),
    'skill'
  )
  expect((await request({ id: 'owner/../skill' })).status).toBe(400)
  expect((await request({ id: 'owner/repo/skill', content: 'untrusted' })).status).toBe(400)
})
it('reports missing content without generating a summary from description', async () => {
  vi.mocked(requestArticleSummary).mockRejectedValue(new SummaryRequestError(422))
  const response = await request({ id: 'owner/repo/skill' })
  expect(response.status).toBe(422)
  expect(await response.json()).toEqual({ error: '暂未收录 SKILL.md，无法生成总结' })
})
