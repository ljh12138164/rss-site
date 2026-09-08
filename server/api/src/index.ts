import { Hono } from 'hono'
import { createDatabase } from './db/client.js'
import { configureApp } from './http-app.js'
import { ingestSignal } from './technology/ingest.js'
import { publishSourceUpdate } from './technology/publish.js'
import { getSignalSource, resolveSignalFeedUrl } from './technology/sources.js'
import { DrizzleSignalStore } from './technology/store.js'

function requiredEnvironment(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

const database = createDatabase(requiredEnvironment('DATABASE_URL'))
const rsshubBaseUrl = (process.env.RSSHUB_BASE_URL ?? 'https://rsshub.app').replace(/\/$/, '')

async function fetchSignalFeed(url: string) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(30_000),
    headers: { 'User-Agent': 'rss-site/1.0 (+https://github.com/ljh12138164/rss-site)' }
  })
  if (!response.ok) throw new Error(`Signal feed responded with ${response.status}`)
  return response.text()
}

export default configureApp(new Hono(), {
  cronSecret: requiredEnvironment('CRON_SECRET'),
  runIngestion: async (sourceId) => {
    const source = getSignalSource(sourceId)
    const result = await ingestSignal(source, {
      fetchFeed: () => fetchSignalFeed(resolveSignalFeedUrl(source, rsshubBaseUrl)),
      store: new DrizzleSignalStore(database, source.id, source.section)
    })
    const publication = await publishSourceUpdate(source, result)
    console.info(JSON.stringify({ source: source.id, batchId: result.batchId, publication }))
    return { ...result, publication }
  }
})
