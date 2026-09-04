import { createApp } from './app'
import { createDatabase } from './db/client'
import { ingestJuejin } from './juejin/ingest'
import { DrizzleJuejinStore } from './juejin/store'

function requiredEnvironment(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

const database = createDatabase(requiredEnvironment('DATABASE_URL'))
const store = new DrizzleJuejinStore(database)
const rsshubBaseUrl = (process.env.RSSHUB_BASE_URL ?? 'https://rsshub.app').replace(/\/$/, '')

async function fetchJuejinFeed() {
  const response = await fetch(`${rsshubBaseUrl}/juejin/trending/all/weekly`, {
    signal: AbortSignal.timeout(15_000),
    headers: { 'User-Agent': 'rss-site/1.0 (+https://github.com/ljh12138164/rss-site)' }
  })
  if (!response.ok) throw new Error(`RSSHub responded with ${response.status}`)
  return response.text()
}

export default createApp({
  cronSecret: requiredEnvironment('CRON_SECRET'),
  runIngestion: () => ingestJuejin({ fetchFeed: fetchJuejinFeed, store })
})
