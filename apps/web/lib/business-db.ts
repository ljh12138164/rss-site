import type { SQL } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// Only imported by server data modules. Never import this module from a client component.
const state = globalThis as typeof globalThis & {
  businessDatabase?: ReturnType<typeof connect>
}

function connect() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('Business database is not configured')
  const client = postgres(url, {
    max: 5,
    prepare: false,
    connect_timeout: 10,
    idle_timeout: 20,
    connection: { statement_timeout: 10000, application_name: 'rss-site-web' },
    types: {
      timestamp: {
        to: 1184,
        from: [1184],
        serialize: (value: Date | string) => (value instanceof Date ? value.toISOString() : value),
        parse: (value: string) => new Date(value).toISOString()
      },
      date: { to: 1082, from: [1082], serialize: (v: string) => v, parse: (v: string) => v }
    }
  })
  return { client, db: drizzle(client) }
}

export function getBusinessDatabase() {
  if (typeof window !== 'undefined') throw new Error('Server-only database')
  state.businessDatabase ??= connect()
  return state.businessDatabase
}

export async function readBusinessRows<T>(statement: SQL): Promise<T[]> {
  return (await getBusinessDatabase().db.execute(statement)) as unknown as T[]
}
