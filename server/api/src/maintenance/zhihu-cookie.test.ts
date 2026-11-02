import { describe, expect, it, vi } from 'vitest'
import { RefreshError } from './zhihu.js'
import {
  type CookieRefreshDependencies,
  type CookieState,
  runZhihuCookieRefresh
} from './zhihu-cookie.js'

function fixture(initialState?: CookieState) {
  let state = initialState ? structuredClone(initialState) : undefined
  const saves: CookieState[] = []
  let locked = false
  const deps: CookieRefreshDependencies = {
    initialCookie: 'z_c0=old',
    now: () => 1700000000000,
    async withLock(action) {
      if (locked) return { status: 'busy' }
      locked = true
      try {
        return await action({
          load: async () => (state ? structuredClone(state) : undefined),
          save: async (value) => {
            state = structuredClone(value)
            saves.push(structuredClone(value))
          }
        })
      } finally {
        locked = false
      }
    },
    refresh: vi.fn(async () => 'z_c0=new'),
    account: vi.fn(async () => 'account-1'),
    publish: vi.fn(async () => 'dpl_1'),
    deploymentStatus: vi.fn(async () => 'READY'),
    verifyRsshub: vi.fn(async () => {})
  }
  return { deps, saves, state: () => state }
}

describe('daily Zhihu credential rotation', () => {
  it('rejects a value-only seed before checking identity or rotating credentials', async () => {
    const { deps } = fixture()
    deps.initialCookie = 'value-only'
    await expect(runZhihuCookieRefresh(deps)).rejects.toThrow('invalid_cookie')
    expect(deps.account).not.toHaveBeenCalled()
    expect(deps.refresh).not.toHaveBeenCalled()
    expect(deps.publish).not.toHaveBeenCalled()
  })

  it('skips a concurrent invocation while the rotation holds the lock', async () => {
    const { deps } = fixture()
    let release!: (cookie: string) => void
    deps.refresh = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          release = resolve
        })
    )
    const first = runZhihuCookieRefresh(deps)
    await vi.waitFor(() => expect(deps.refresh).toHaveBeenCalledOnce())
    expect(await runZhihuCookieRefresh(deps)).toEqual({ status: 'busy' })
    release('z_c0=new')
    await first
    expect(deps.publish).toHaveBeenCalledOnce()
  })

  it('persists the candidate and latest Cookie before publishing and reports pending, not success', async () => {
    const { deps, saves, state } = fixture()
    deps.publish = vi.fn(async () => {
      expect(state()?.cookie).toBe('z_c0=new')
      expect(state()?.publishPending).toBe(true)
      return 'dpl_1'
    })
    expect(await runZhihuCookieRefresh(deps)).toEqual({
      status: 'deployment_pending',
      deploymentId: 'dpl_1'
    })
    expect(saves[0].candidate).toBe('z_c0=new')
    expect(await runZhihuCookieRefresh(deps)).toEqual({
      status: 'published',
      deploymentId: 'dpl_1'
    })
    expect(deps.verifyRsshub).toHaveBeenCalledOnce()
    expect(deps.refresh).toHaveBeenCalledOnce()
  })

  it('retries publication with the saved Cookie after Vercel fails', async () => {
    const { deps, state } = fixture()
    deps.publish = vi
      .fn()
      .mockRejectedValueOnce(new Error('vercel unavailable'))
      .mockResolvedValue('dpl_1')
    await expect(runZhihuCookieRefresh(deps)).rejects.toThrow('vercel unavailable')
    expect(state()?.cookie).toBe('z_c0=new')
    await runZhihuCookieRefresh(deps)
    expect(deps.refresh).toHaveBeenCalledOnce()
    expect(deps.publish).toHaveBeenLastCalledWith('z_c0=new')
  })

  it('retries verification of a saved candidate without rotating the old Cookie again', async () => {
    const { deps } = fixture({ cookie: 'z_c0=old', candidate: 'z_c0=new', accountId: 'account-1' })
    await runZhihuCookieRefresh(deps)
    expect(deps.refresh).not.toHaveBeenCalled()
    expect(deps.account).toHaveBeenCalledWith('z_c0=new')
  })

  it('refuses to publish a credential for another account', async () => {
    const { deps, state } = fixture({ cookie: 'z_c0=old', accountId: 'account-1' })
    deps.account = vi.fn(async () => 'account-2')
    await expect(runZhihuCookieRefresh(deps)).rejects.toThrow('account_mismatch')
    expect(state()?.candidate).toBe('z_c0=new')
    expect(deps.publish).not.toHaveBeenCalled()
  })

  it('allows the refresh endpoint to recover an expired business API token', async () => {
    const { deps } = fixture()
    deps.account = vi
      .fn()
      .mockRejectedValueOnce(new RefreshError('upstream_http_401'))
      .mockResolvedValue('account-1')
    expect((await runZhihuCookieRefresh(deps)).status).toBe('deployment_pending')
  })

  it('does not redeploy when the validated Cookie is unchanged', async () => {
    const { deps } = fixture()
    deps.refresh = vi.fn(async () => 'z_c0=old')
    expect(await runZhihuCookieRefresh(deps)).toEqual({ status: 'unchanged' })
    expect(deps.publish).not.toHaveBeenCalled()
  })

  it('does not start another refresh while a deployment is still building', async () => {
    const { deps } = fixture({ cookie: 'z_c0=new', deploymentId: 'dpl_1', publishPending: true })
    deps.deploymentStatus = vi.fn(async () => 'BUILDING')
    expect((await runZhihuCookieRefresh(deps)).status).toBe('deployment_pending')
    expect(deps.refresh).not.toHaveBeenCalled()
    expect(deps.verifyRsshub).not.toHaveBeenCalled()
  })

  it('does not mark publication complete when the RSSHub login check fails', async () => {
    const { deps, state } = fixture({
      cookie: 'z_c0=new',
      deploymentId: 'dpl_1',
      publishPending: true
    })
    deps.verifyRsshub = vi.fn(async () => {
      throw new Error('not logged in')
    })
    await expect(runZhihuCookieRefresh(deps)).rejects.toThrow('not logged in')
    expect(state()?.publishPending).toBe(true)
  })

  it('continues with the saved credential after a failed deployment', async () => {
    const { deps } = fixture({ cookie: 'z_c0=new', deploymentId: 'dpl_old', publishPending: true })
    deps.deploymentStatus = vi.fn(async () => 'ERROR')
    expect(await runZhihuCookieRefresh(deps)).toEqual({
      status: 'deployment_pending',
      deploymentId: 'dpl_1'
    })
    expect(deps.refresh).not.toHaveBeenCalled()
  })

  it('applies the daily cooldown to duplicate invocations', async () => {
    const { deps } = fixture({ cookie: 'z_c0=new', refreshedAt: 1700000000000 })
    expect(await runZhihuCookieRefresh(deps)).toEqual({ status: 'not_due' })
    expect(deps.refresh).not.toHaveBeenCalled()
  })

  it('continues the daily rotation after verifying the previous day deployment', async () => {
    const { deps } = fixture({
      cookie: 'z_c0=old',
      deploymentId: 'dpl_old',
      publishPending: true,
      refreshedAt: 1699900000000
    })
    expect((await runZhihuCookieRefresh(deps)).status).toBe('deployment_pending')
    expect(deps.refresh).toHaveBeenCalledOnce()
  })
})
