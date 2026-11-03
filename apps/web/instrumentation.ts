export async function register() {
  if (
    process.env.NEXT_RUNTIME !== 'nodejs' ||
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PHASE === 'phase-production-build' ||
    !process.env.REDIS_URL
  )
    return

  const { startListCacheMaintenance } = await import('./lib/list-cache-maintenance')
  startListCacheMaintenance()
}
