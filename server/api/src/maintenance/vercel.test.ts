import { describe, expect, it, vi } from 'vitest'
import { vercelClient } from './vercel.js'

describe('RSSHub Vercel publication', () => {
  it('updates only the production Cookie and redeploys the existing production commit', async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({ envs: [{ id: 'env_1', key: 'ZHIHU_COOKIES', target: ['production'] }] })
      )
      .mockResolvedValueOnce(Response.json({}))
      .mockResolvedValueOnce(Response.json({ deployments: [{ uid: 'dpl_old', name: 'rss-hub' }] }))
      .mockResolvedValueOnce(Response.json({ id: 'dpl_new' }))
    const client = vercelClient(
      { token: 'synthetic', projectId: 'prj_test', teamId: 'team_test' },
      request
    )
    expect(await client.publish('z_c0=synthetic')).toBe('dpl_new')
    expect(JSON.parse(String(request.mock.calls[1][1]?.body))).toEqual({ value: 'z_c0=synthetic' })
    expect(JSON.parse(String(request.mock.calls[3][1]?.body))).toMatchObject({
      name: 'rss-hub',
      project: 'prj_test',
      deploymentId: 'dpl_old',
      target: 'production',
      withLatestCommit: false
    })
    for (const [url, init] of request.mock.calls) {
      expect(new URL(String(url)).searchParams.get('teamId')).toBe('team_test')
      expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer synthetic')
      expect(init?.redirect).toBe('manual')
    }
  })

  it('refuses to overwrite a variable shared with Preview', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        envs: [{ id: 'env_1', key: 'ZHIHU_COOKIES', target: ['production', 'preview'] }]
      })
    )
    const client = vercelClient({ token: 'synthetic', projectId: 'prj_test' }, request)
    await expect(client.publish('z_c0=synthetic')).rejects.toThrow(
      'production_cookie_variable_required'
    )
    expect(request).toHaveBeenCalledOnce()
  })

  it('checks deployment ownership before trusting READY', async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json({ projectId: 'prj_other', target: 'production', readyState: 'READY' })
      )
    await expect(
      vercelClient({ token: 'synthetic', projectId: 'prj_test' }, request).status('dpl_1')
    ).rejects.toThrow('invalid_deployment')
  })
})
