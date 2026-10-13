import { createHash } from 'node:crypto'
import { Redis } from 'ioredis'

export const RESULT_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60

let client: Redis | undefined
let connecting: Promise<Redis> | undefined

function discardClient(failed: Redis | null | undefined) {
  failed?.disconnect()
  if (client === failed) client = undefined
}

export function createResultCacheKey(namespace: string, version: string, input: unknown) {
  const hash = createHash('sha256').update(JSON.stringify(input)).digest('hex')
  return `rss-site:${namespace}:${version}:${hash}`
}

async function getClient() {
  const url = process.env.REDIS_URL
  if (!url) return null
  if (client?.status === 'ready') return client
  if (connecting) return connecting

  client?.disconnect()
  const next = new Redis(url, {
    lazyConnect: true,
    connectTimeout: 500,
    commandTimeout: 500,
    enableReadyCheck: false,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 0,
    retryStrategy: () => null
  })
  // Errors may contain the connection URL; only log generic messages below.
  next.on('error', () => undefined)
  client = next
  connecting = next
    .connect()
    .then(() => next)
    .catch((error) => {
      discardClient(next)
      throw error
    })
    .finally(() => {
      connecting = undefined
    })
  return connecting
}

export async function readResultCache<T>(
  key: string,
  validate: (value: unknown) => value is T
): Promise<T | null> {
  let redis: Redis | null | undefined
  let raw: string | null
  try {
    redis = await getClient()
    if (!redis) return null
    raw = await redis.get(key)
  } catch {
    discardClient(redis)
    console.warn('[result-cache] Cache read unavailable; continuing without cache')
    return null
  }
  if (raw === null) return null
  try {
    const value: unknown = JSON.parse(raw)
    return validate(value) ? value : null
  } catch {
    return null
  }
}

export async function writeResultCache(key: string, value: unknown) {
  let redis: Redis | null | undefined
  try {
    redis = await getClient()
    if (redis) await redis.set(key, JSON.stringify(value), 'EX', RESULT_CACHE_TTL_SECONDS)
  } catch {
    discardClient(redis)
    console.warn('[result-cache] Cache write unavailable; result was not cached')
  }
}
