import { RefreshError } from './zhihu.js'

export interface CookieState {
  cookie: string
  accountId?: string
  candidate?: string
  refreshedAt?: number
  publishPending?: boolean
  deploymentId?: string
}

export interface CookieStore {
  load(): Promise<CookieState | undefined>
  save(state: CookieState): Promise<void>
}

export interface CookieRefreshDependencies {
  initialCookie?: string
  withLock(
    action: (store: CookieStore) => Promise<CookieRefreshResult>
  ): Promise<CookieRefreshResult>
  refresh(cookie: string): Promise<string>
  account(cookie: string): Promise<string>
  publish(cookie: string): Promise<string>
  deploymentStatus(id: string): Promise<string>
  verifyRsshub(): Promise<void>
  now?: () => number
}

export interface CookieRefreshResult {
  status: 'busy' | 'unchanged' | 'deployment_pending' | 'published' | 'not_due'
  deploymentId?: string
}

export async function runZhihuCookieRefresh(deps: CookieRefreshDependencies) {
  return deps.withLock(async (store) => {
    const now = (deps.now ?? Date.now)()
    let state = await store.load()
    if (!state) {
      if (!deps.initialCookie) throw new RefreshError('missing_initial_cookie')
      state = { cookie: deps.initialCookie }
    }

    if (state.deploymentId) {
      const status = await deps.deploymentStatus(state.deploymentId)
      if (status === 'ERROR' || status === 'CANCELED') {
        delete state.deploymentId
        await store.save(state)
      } else if (status !== 'READY') {
        return { status: 'deployment_pending', deploymentId: state.deploymentId }
      } else {
        await deps.verifyRsshub()
        state.publishPending = false
        const deploymentId = state.deploymentId
        delete state.deploymentId
        await store.save(state)
        if (state.refreshedAt && now - state.refreshedAt < 23 * 60 * 60 * 1000) {
          return { status: 'published', deploymentId }
        }
      }
    }

    if (!state.publishPending) {
      if (!state.candidate) {
        if (state.refreshedAt && now - state.refreshedAt < 23 * 60 * 60 * 1000) {
          return { status: 'not_due' }
        }
        if (!state.accountId) {
          try {
            state.accountId = await deps.account(state.cookie)
          } catch (error) {
            // A business API 401 may still be recoverable through the refresh endpoint.
            if (!(error instanceof RefreshError) || error.code !== 'upstream_http_401') throw error
          }
        }
        state.candidate = await deps.refresh(state.cookie)
        // Persist before verification or deployment: the old credential may be invalidated.
        await store.save(state)
      }
      const accountId = await deps.account(state.candidate)
      if (state.accountId && accountId !== state.accountId)
        throw new RefreshError('account_mismatch')
      const changed = state.cookie !== state.candidate
      state.cookie = state.candidate
      state.accountId = accountId
      state.refreshedAt = now
      state.publishPending = changed
      delete state.candidate
      await store.save(state)
      if (!changed) return { status: 'unchanged' }
    }

    state.deploymentId = await deps.publish(state.cookie)
    await store.save(state)
    return { status: 'deployment_pending', deploymentId: state.deploymentId }
  })
}
