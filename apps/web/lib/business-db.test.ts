import { afterEach, describe, expect, it, vi } from 'vitest'
import { getBusinessDatabase } from './business-db'

afterEach(async () => {
  const state = globalThis as typeof globalThis & {
    businessDatabase?: ReturnType<typeof getBusinessDatabase>
  }
  await state.businessDatabase?.client.end()
  delete state.businessDatabase
  vi.unstubAllEnvs()
})

describe('business database driver', () => {
  it('preserves ISO timestamp parsing after Drizzle initializes the shared client', () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://localhost/rss_site')
    const database = getBusinessDatabase()
    const timestamp = '2026-11-05 06:20:30+00'
    expect(database.client.options.parsers[1184](timestamp)).toBe('2026-11-05T06:20:30.000Z')
    expect(getBusinessDatabase().db).toBe(database.db)
    expect(database.client.options.parsers[1184](timestamp)).toBe('2026-11-05T06:20:30.000Z')
    expect(database.client.options.serializers[1184](new Date(timestamp))).toBe(
      '2026-11-05T06:20:30.000Z'
    )
  })
})
