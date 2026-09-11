import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'

export function createDatabase(databaseUrl: string) {
  return createDatabaseConnection(databaseUrl).database
}

export function createDatabaseConnection(databaseUrl: string) {
  const client = postgres(databaseUrl, {
    prepare: false,
    max: 1,
    connect_timeout: 10,
    idle_timeout: 20
  })

  return {
    database: drizzle({ client, schema }),
    close: () => client.end({ timeout: 5 })
  }
}

export type Database = ReturnType<typeof createDatabase>
