import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { register } from './instrumentation'

const { start } = vi.hoisted(() => ({ start: vi.fn() }))
vi.mock('./lib/list-cache-maintenance', () => ({ startListCacheMaintenance: start }))

beforeEach(() => {
  start.mockReset()
  vi.stubEnv('NODE_ENV', 'production')
  vi.stubEnv('NEXT_RUNTIME', 'nodejs')
  vi.stubEnv('NEXT_PHASE', '')
  vi.stubEnv('REDIS_URL', 'redis://localhost:6379')
})
afterEach(() => vi.unstubAllEnvs())

it('starts nonblocking maintenance in the production Node server', async () => {
  await register()
  expect(start).toHaveBeenCalledOnce()
})

it.each([
  ['NODE_ENV', 'development'],
  ['NEXT_RUNTIME', 'edge'],
  ['NEXT_PHASE', 'phase-production-build'],
  ['REDIS_URL', '']
])('does not start maintenance with %s=%s', async (key, value) => {
  vi.stubEnv(key, value)
  await register()
  expect(start).not.toHaveBeenCalled()
})
