import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const { warm } = vi.hoisted(() => ({ warm: vi.fn() }))
vi.mock('./list-cache-prewarm', () => ({ warmListCaches: warm }))

beforeEach(() => {
  vi.resetModules()
  vi.useFakeTimers()
  warm.mockReset().mockResolvedValue({ total: 50, succeeded: 50, failed: [] })
  vi.spyOn(console, 'info').mockImplementation(() => undefined)
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
})
afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

it('warms on startup and every 15 minutes without visitor requests or duplicate timers', async () => {
  const { startListCacheMaintenance } = await import('./list-cache-maintenance')
  startListCacheMaintenance()
  startListCacheMaintenance()
  expect(warm).toHaveBeenCalledTimes(1)
  await vi.advanceTimersByTimeAsync(15 * 60 * 1000)
  expect(warm).toHaveBeenCalledTimes(2)
  expect(console.info).toHaveBeenLastCalledWith(
    expect.stringContaining('"listMaintenance":"succeeded"')
  )
})

it('retries only failed scopes once and reports the final coverage', async () => {
  warm.mockResolvedValueOnce({ total: 50, succeeded: 49, failed: ['source:zhihu'] })
  warm.mockResolvedValueOnce({ total: 1, succeeded: 1, failed: [] })
  const { startListCacheMaintenance } = await import('./list-cache-maintenance')
  startListCacheMaintenance()
  await vi.advanceTimersByTimeAsync(0)
  expect(warm).toHaveBeenCalledTimes(2)
  expect(warm.mock.calls[1][0]).toEqual(['source:zhihu'])
  expect(console.info).toHaveBeenCalledWith(
    expect.stringContaining('"total":50,"succeeded":50,"failed":[]')
  )
})

it('does not overlap a slow round and resumes after it finishes', async () => {
  let finish!: (value: unknown) => void
  warm.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve
      })
  )
  const { startListCacheMaintenance } = await import('./list-cache-maintenance')
  startListCacheMaintenance()
  await vi.advanceTimersByTimeAsync(15 * 60 * 1000)
  expect(warm).toHaveBeenCalledTimes(1)
  finish({ total: 50, succeeded: 50, failed: [] })
  await vi.advanceTimersByTimeAsync(15 * 60 * 1000)
  expect(warm).toHaveBeenCalledTimes(2)
})

it('logs only a safe failure and tries again on the next scheduled round', async () => {
  warm.mockRejectedValueOnce(new Error('private-connection-url'))
  const { startListCacheMaintenance } = await import('./list-cache-maintenance')
  startListCacheMaintenance()
  await vi.advanceTimersByTimeAsync(0)
  expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('"listMaintenance":"failed"'))
  expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain('private-connection-url')
  await vi.advanceTimersByTimeAsync(15 * 60 * 1000)
  expect(warm).toHaveBeenCalledTimes(2)
})
