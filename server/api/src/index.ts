import { Hono } from 'hono'
import { createDatabase } from './db/client.js'
import { configureApp } from './http-app.js'
import { ingestTechnology } from './technology/ingest.js'
import { getTechnologySource } from './technology/sources.js'
import { DrizzleTechnologyStore } from './technology/store.js'

function requiredEnvironment(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

const database = createDatabase(requiredEnvironment('DATABASE_URL'))
const rsshubBaseUrl = (process.env.RSSHUB_BASE_URL ?? 'https://rsshub.app').replace(/\/$/, '')

async function fetchTechnologyFeed(path: string) {
  const response = await fetch(`${rsshubBaseUrl}${path}`, {
    signal: AbortSignal.timeout(30_000),
    headers: { 'User-Agent': 'rss-site/1.0 (+https://github.com/ljh12138164/rss-site)' }
  })
  if (!response.ok) throw new Error(`RSSHub responded with ${response.status}`)
  return response.text()
}

export default configureApp(new Hono(), {
  cronSecret: requiredEnvironment('CRON_SECRET'),
  runIngestion: (sourceId) => {
    const source = getTechnologySource(sourceId)
    return ingestTechnology(source, {
      fetchFeed: () => fetchTechnologyFeed(source.rsshubPath),
      store: new DrizzleTechnologyStore(database, source.id)
    })
  }
})
