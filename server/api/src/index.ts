import { Hono } from 'hono'
import { createDatabaseConnection } from './db/client.js'
import { configureApp } from './http-app.js'
import { ingestSignal } from './technology/ingest.js'
import { publishSourceUpdate } from './technology/publish.js'
import { getSignalSource, resolveSignalFeedUrl } from './technology/sources.js'
import { DrizzleSignalStore } from './technology/store.js'

interface ApiRuntime {
  databaseUrl: string
  cronSecret: string
  rsshubBaseUrl: string
  webAppUrl?: string
  revalidateSecret?: string
}

const maxFeedBytes = 5_000_000

async function readBoundedText(response: Response) {
  const contentLength = Number(response.headers.get('Content-Length'))
  if (contentLength > maxFeedBytes) throw new Error('Signal feed exceeded the response size limit')
  if (!response.body) return ''

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let size = 0
  let text = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > maxFeedBytes) {
      await reader.cancel()
      throw new Error('Signal feed exceeded the response size limit')
    }
    text += decoder.decode(value, { stream: true })
  }
  return text + decoder.decode()
}

async function fetchSignalFeed(url: string) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(30_000),
    headers: { 'User-Agent': 'rss-site/1.0 (+https://github.com/ljh12138164/rss-site)' }
  })
  if (!response.ok) throw new Error(`Signal feed responded with ${response.status}`)
  return readBoundedText(response)
}

export function createApp(runtime: ApiRuntime) {
  const rsshubBaseUrl = runtime.rsshubBaseUrl.replace(/\/$/, '')
  return configureApp(new Hono(), {
    cronSecret: runtime.cronSecret,
    runIngestion: async (sourceId) => {
      const connection = createDatabaseConnection(runtime.databaseUrl)
      try {
        const source = getSignalSource(sourceId)
        const result = await ingestSignal(source, {
          fetchFeed: () => fetchSignalFeed(resolveSignalFeedUrl(source, rsshubBaseUrl)),
          store: new DrizzleSignalStore(connection.database, source.id, source.section)
        })
        const publication = await publishSourceUpdate(source, result, {
          webAppUrl: runtime.webAppUrl,
          revalidateSecret: runtime.revalidateSecret
        })
        console.info(JSON.stringify({ source: source.id, batchId: result.batchId, publication }))
        return { ...result, publication }
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
