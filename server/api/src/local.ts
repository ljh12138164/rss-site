import { serve } from '@hono/node-server'
import { createApp } from './index.js'

function requiredEnvironment(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

const app = createApp({
  databaseUrl: requiredEnvironment('DATABASE_URL'),
  cronSecret: requiredEnvironment('CRON_SECRET'),
  rsshubBaseUrl: process.env.RSSHUB_BASE_URL ?? 'https://rsshub.app',
  webAppUrl: process.env.WEB_APP_URL,
  revalidateSecret: process.env.REVALIDATE_SECRET
})

const port = 3001

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`)
})
