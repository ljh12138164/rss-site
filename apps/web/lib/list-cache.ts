import { randomUUID } from 'node:crypto'
import { withRedisCache } from './redis-cache'

const inFlight = new Map<string, Promise<{ value: unknown; written: unknown }>>()

// Losing an evicted generation must also discard its data, never reuse a default version.
const readScript = `
local generation = redis.call('GET', KEYS[1])
if not generation then
  generation = ARGV[1]
  redis.call('SET', KEYS[1], generation, 'EX', 86400)
  redis.call('DEL', KEYS[2])
end
return {generation, redis.call('GET', KEYS[2]) or ''}
`
const writeScript = `
if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[2], ARGV[2], 'EX', ARGV[3])
return 1
`
const invalidateScript = `
for i = 1, #KEYS, 2 do
  redis.call('SET', KEYS[i], ARGV[1], 'EX', 86400)
  redis.call('DEL', KEYS[i + 1])
end
return 1
`

export function listCacheKeys(scope: string) {
  return [`rss-site:lists:v1:${scope}:generation`, `rss-site:lists:v1:${scope}:data`]
}

export async function invalidateListCaches(scopes: string[]): Promise<boolean> {
  if (!scopes.length || !process.env.REDIS_URL) return true
  const keys = [...new Set(scopes)].flatMap(listCacheKeys)
  return (
    (await withRedisCache((redis) =>
      redis.eval(invalidateScript, keys.length, ...keys, randomUUID())
    )) === 1
  )
}

export async function getCachedList<T extends { items: unknown[] | null }>(
  scope: string,
  validate: (value: unknown) => value is T,
  load: () => Promise<T>,
  refresh = false
): Promise<T> {
  return readList(scope, validate, load, refresh, false)
}

async function readList<T extends { items: unknown[] | null }>(
  scope: string,
  validate: (value: unknown) => value is T,
  load: () => Promise<T>,
  refresh: boolean,
  retried: boolean
): Promise<T> {
  const keys = listCacheKeys(scope)
  const snapshot = await withRedisCache(
    (redis) => redis.eval(readScript, 2, ...keys, randomUUID()) as Promise<[string, string]>
  )
  if (!snapshot) {
    if (refresh) throw new Error('List cache unavailable')
    return load()
  }
  const [generation, raw] = snapshot
  if (!refresh && raw) {
    try {
      const value: unknown = JSON.parse(raw)
      if (validate(value)) return value
    } catch {
      // Invalid cache data is replaced by the successful database result below.
    }
  }
  const pendingKey = `${scope}:${generation}`
  const request =
    inFlight.get(pendingKey) ??
    (async () => {
      const value = await load()
      if (!validate(value)) throw new Error('Invalid list result')
      const ttl = value.items?.length ? 300 + Math.floor(Math.random() * 31) : 30
      const written = await withRedisCache((redis) =>
        redis.eval(writeScript, 2, ...keys, generation, JSON.stringify(value), ttl)
      )
      return { value, written }
    })()
  inFlight.set(pendingKey, request)
  try {
    const { value, written } = await request
    // An old SSR query must not render stale data after a publication either.
    if (written === 0 && !refresh && !retried) return readList(scope, validate, load, false, true)
    if (written === 0) throw new Error('List cache refresh not committed')
    if (refresh && written !== 1) throw new Error('List cache refresh not committed')
    return value as T
  } finally {
    if (inFlight.get(pendingKey) === request) inFlight.delete(pendingKey)
  }
}
