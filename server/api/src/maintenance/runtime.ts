import postgres from 'postgres'
import { vaultCookieLock } from './store.js'
import { vercelClient } from './vercel.js'
import { RefreshError, refreshZhihuCookie, requestJson, zhihuAccount } from './zhihu.js'
import { runZhihuCookieRefresh } from './zhihu-cookie.js'

export interface CookieRefreshRuntime {
  databaseUrl: string
  rsshubBaseUrl: string
  zhihuCookie?: string
  vercelToken?: string
  vercelProjectId?: string
  vercelTeamId?: string
}

export async function refreshCookieFromRuntime(runtime: CookieRefreshRuntime) {
  if (!runtime.vercelToken || !runtime.vercelProjectId)
    throw new RefreshError('missing_vercel_configuration')
  const vercel = vercelClient({
    token: runtime.vercelToken,
    projectId: runtime.vercelProjectId,
    teamId: runtime.vercelTeamId
  })
  const sql = postgres(runtime.databaseUrl, {
    prepare: false,
    max: 2,
    connect_timeout: 10,
    idle_timeout: 20
  })
  try {
    return await runZhihuCookieRefresh({
      initialCookie: runtime.zhihuCookie,
      withLock: vaultCookieLock(sql),
      refresh: refreshZhihuCookie,
      account: zhihuAccount,
      publish: vercel.publish,
      deploymentStatus: vercel.status,
      async verifyRsshub() {
        const url = new URL('/api/zhihu/check-cookie', runtime.rsshubBaseUrl)
        if (url.protocol !== 'https:') throw new RefreshError('invalid_rsshub_url')
        const response = await requestJson(fetch, url.toString())
        const data = (await response.json()) as { code?: unknown }
        if (data.code !== 0) throw new RefreshError('rsshub_login_check_failed')
      }
    })
  } finally {
    await sql.end({ timeout: 5 })
  }
}
