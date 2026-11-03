import { warmListCaches } from './list-cache-prewarm'

let timer: ReturnType<typeof setInterval> | undefined

// This deployment runs a single long-lived Next server, not request-scoped workers.
export function startListCacheMaintenance() {
  if (timer) return
  let running = false
  const refresh = async () => {
    if (running) return
    running = true
    try {
      const deadline = AbortSignal.timeout(5 * 60 * 1000)
      let result = await warmListCaches(undefined, deadline)
      if (result.failed.length) {
        const retry = await warmListCaches(result.failed, deadline)
        result = {
          total: result.total,
          succeeded: result.succeeded + retry.succeeded,
          failed: retry.failed
        }
      }
      console.info(
        JSON.stringify({
          listMaintenance: result.failed.length ? 'partial' : 'succeeded',
          ...result,
          at: new Date().toISOString()
        })
      )
    } catch {
      console.warn(JSON.stringify({ listMaintenance: 'failed', at: new Date().toISOString() }))
    } finally {
      running = false
    }
  }
  timer = setInterval(() => void refresh(), 15 * 60 * 1000)
  timer.unref()
  void refresh()
}
