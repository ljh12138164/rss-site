import { randomUUID } from 'node:crypto'
import { withRedisCache } from './redis-cache'

export const DAILY_CACHE_TTL_SECONDS = 300
export const DAILY_CACHE_GENERATION_KEY = 'rss-site:daily:v1:generation'
export const dailyCacheKey = (key: string) => `rss-site:daily:v1:${key}`

const readScript = `
local generation = redis.call('GET', KEYS[1])
if not generation then
  generation = ARGV[1]
  redis.call('SET', KEYS[1], generation)
end
return {generation, redis.call('GET', KEYS[2]) or ''}
`
const writeScript = `
if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[2], ARGV[2], 'EX', ARGV[3])
return 1
`
const inFlight = new Map<string, Promise<unknown>>()

export async function invalidateDailyReportCache(): Promise<boolean> {
  if (!process.env.REDIS_URL) return true
  return (
    (await withRedisCache((redis) => redis.set(DAILY_CACHE_GENERATION_KEY, randomUUID()))) === 'OK'
  )
}

export async function getCachedDailyData<T>(
  key: string,
  parse: (value: unknown) => T,
  load: () => Promise<unknown>
): Promise<T> {
  const dataKey = dailyCacheKey(key)
  for (let attempt = 0; attempt < 2; attempt++) {
    const state = await withRedisCache((redis) =>
      redis.eval(readScript, 2, DAILY_CACHE_GENERATION_KEY, dataKey, randomUUID())
    )
    if (!Array.isArray(state)) return parse(await load())
    const [generation, raw] = state as [string, string]
    if (raw) {
      try {
        const cached = JSON.parse(raw)
        if (cached.generation === generation) return parse(cached.value)
      } catch {
        // Corrupt or obsolete entries are replaced by a validated database read.
      }
    }
    const flightKey = `${dataKey}:${generation}`
    let flight = inFlight.get(flightKey)
    if (!flight) {
      flight = load()
      inFlight.set(flightKey, flight)
    }
    let value: unknown
    try {
      value = await flight
    } finally {
      if (inFlight.get(flightKey) === flight) inFlight.delete(flightKey)
    }
    const parsed = parse(value)
    const written = await withRedisCache((redis) =>
      redis.eval(
        writeScript,
        2,
        DAILY_CACHE_GENERATION_KEY,
        dataKey,
        generation,
        JSON.stringify({ generation, value }),
        DAILY_CACHE_TTL_SECONDS
      )
    )
    // A publication during the read must also refresh this response, not only Redis.
    if (written !== 0) return parsed
  }
  throw new Error('Daily report changed during cache fill')
}
