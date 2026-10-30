import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../db/schema.js'
import { ingestAiModels } from './ai-models.js'

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('Missing DATABASE_URL in environment')
  }

  const rsshubBaseUrl = process.env.RSSHUB_BASE_URL || 'https://rss.ljhboard.cn'
  console.log(`Starting AI models ingestion from ${rsshubBaseUrl}...`)

  const client = postgres(databaseUrl, {
    prepare: false,
    max: 1,
    connect_timeout: 30,
    idle_timeout: 300
  })
  const db = drizzle({ client, schema })

  try {
    const result = await ingestAiModels({
      db,
      rsshubBaseUrl
    })

    console.log('Ingestion succeeded!')
    console.log(`Batch ID: ${result.batchId}`)
    console.log(`Models written: ${result.modelCount}`)
    console.log(`Prices written: ${result.priceCount}`)
    console.log(`Category ranks written: ${result.rankCount}`)
    console.log(`Evidences written: ${result.evidenceCount}`)
    console.log(`Duration: ${(result.durationMs / 1000).toFixed(2)}s`)
  } finally {
    await client.end({ timeout: 5 })
  }
}

main().catch((err) => {
  console.error('Ingestion failed:', err)
  process.exitCode = 1
})
