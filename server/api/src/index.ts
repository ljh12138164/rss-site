import { getSignalSource } from '@rss-site/signals'
import { Hono } from 'hono'
import { createDatabaseConnection } from './db/client.js'
import { configureApp } from './http-app.js'
import { runIngestionPipeline } from './ingestion/pipeline.js'
import { fetchMcpNews } from './mcp/service.js'

interface ApiRuntime {
  databaseUrl: string
  cronSecret: string
  rsshubBaseUrl: string
  webAppUrl?: string
  revalidateSecret?: string
}

export function createApp(runtime: ApiRuntime) {
  return configureApp(new Hono(), {
    cronSecret: runtime.cronSecret,
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
      revalidateSecret: env.REVALIDATE_SECRET
    }).fetch(request, env, context)
  }
} satisfies ExportedHandler<Env>
