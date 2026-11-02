import { getSignalSource } from '@rss-site/signals'
import { Hono } from 'hono'
import { createDatabaseConnection } from './db/client.js'
import { configureApp } from './http-app.js'
import { runIngestionPipeline } from './ingestion/pipeline.js'
import { type CookieRefreshRuntime, refreshCookieFromRuntime } from './maintenance/runtime.js'
import { RefreshError } from './maintenance/zhihu.js'
import { fetchMcpNews } from './mcp/service.js'

interface ApiRuntime extends CookieRefreshRuntime {
  databaseUrl: string
  cronSecret: string
  rsshubBaseUrl: string
  webAppUrl?: string
  revalidateSecret?: string
}

export function createApp(runtime: ApiRuntime) {
  return configureApp(new Hono(), {
    cronSecret: runtime.cronSecret,
    refreshZhihuCookie: () => refreshCookieFromRuntime(runtime),
    fetchNews: async (options) => {
      const connection = createDatabaseConnection(runtime.databaseUrl)
      try {
        return await fetchMcpNews(connection.database, options)
      } finally {
        await connection.close()
      }
    },
    runIngestion: async (sourceId) => {
      const connection = createDatabaseConnection(runtime.databaseUrl)
      try {
        const source = getSignalSource(sourceId)
        return await runIngestionPipeline(source, {
          db: connection.database,
          rsshubBaseUrl: runtime.rsshubBaseUrl,
          webAppUrl: runtime.webAppUrl,
          revalidateSecret: runtime.revalidateSecret
        })
      } finally {
        await connection.close()
      }
    }
  })
}

export default {
  fetch(request, env, context) {
    return createApp({
      databaseUrl: env.HYPERDRIVE.connectionString,
      cronSecret: env.CRON_SECRET,
      rsshubBaseUrl: env.RSSHUB_BASE_URL,
      webAppUrl: env.WEB_APP_URL,
      revalidateSecret: env.REVALIDATE_SECRET,
      ...cookieConfiguration(env)
    }).fetch(request, env, context)
  },
  async scheduled(_controller, env) {
    if (env.ZHIHU_REFRESH_ENABLED !== 'true') return
    try {
      const result = await refreshCookieFromRuntime({
        databaseUrl: env.HYPERDRIVE.connectionString,
        rsshubBaseUrl: env.RSSHUB_BASE_URL,
        ...cookieConfiguration(env)
      })
      console.info(JSON.stringify({ job: 'zhihu-cookie-refresh', ...result }))
    } catch (error) {
      const code = error instanceof RefreshError ? error.code : 'request_failed'
      console.error(JSON.stringify({ job: 'zhihu-cookie-refresh', status: 'failed', code }))
      // Keep the scheduled invocation failed in Cloudflare metrics without exposing upstream errors.
      throw new Error(`zhihu-cookie-refresh: ${code}`)
    }
  }
} satisfies ExportedHandler<Env>

function cookieConfiguration(env: Env) {
  return {
    zhihuCookie: env.ZHIHU_COOKIES,
    vercelToken: env.VERCEL_API_TOKEN,
    vercelProjectId: env.RSSHUB_VERCEL_PROJECT_ID,
    vercelTeamId: env.RSSHUB_VERCEL_TEAM_ID || undefined
  }
}
