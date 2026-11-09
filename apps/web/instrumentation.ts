export async function register() {
  if (
    process.env.NEXT_RUNTIME !== 'nodejs' ||
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PHASE === 'phase-production-build'
  )
    return

  if (process.env.REDIS_URL) {
    const { startListCacheMaintenance } = await import('./lib/list-cache-maintenance')
    startListCacheMaintenance()
  }
  if (
    process.env.DATABASE_URL &&
    process.env.AGENT_SERVICE_URL &&
    process.env.AGENT_SERVICE_TOKEN
  ) {
    const { startHotRankingMaintenance } = await import('./lib/hot-ranking')
    startHotRankingMaintenance()
  }
}
