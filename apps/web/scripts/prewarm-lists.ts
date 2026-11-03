import { warmListCaches } from '../lib/list-cache-prewarm'
import { listCacheTargets } from '../lib/list-cache-scopes'

// Bundled for the standalone image; run inside the web container, never through the CDN.
async function main() {
  if (!process.env.REDIS_URL) {
    console.info(JSON.stringify({ listPrewarm: 'disabled' }))
    return
  }
  const targets = listCacheTargets()
  const requested = process.argv.slice(2)
  if (requested.some((scope) => !targets.some((target) => target.scope === scope)))
    throw new Error('Invalid prewarm scope')
  const scopes = requested.length ? [...new Set(requested)] : targets.map((target) => target.scope)
  // Force-refresh in place so an outage leaves the previous successful lists readable.
  const deadline = AbortSignal.timeout(5 * 60 * 1000)
  let result = await warmListCaches(scopes, deadline)
  if (result.failed.length) {
    const retry = await warmListCaches(result.failed, deadline)
    result = {
      total: result.total,
      succeeded: result.succeeded + retry.succeeded,
      failed: retry.failed
    }
  }
  console.info(
    JSON.stringify({ listPrewarm: result.failed.length ? 'partial' : 'succeeded', ...result })
  )
  if (result.failed.length) process.exitCode = 1
}

try {
  await main()
} catch {
  console.error(JSON.stringify({ listPrewarm: 'failed' }))
  process.exitCode = 1
}
// ioredis keeps a socket open; this one-shot process has finished all awaited commands.
process.exit(process.exitCode ?? 0)
