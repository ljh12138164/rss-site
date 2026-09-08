import { afterEach, expect, it, vi } from 'vitest'
import { GET } from './route'

afterEach(() => vi.unstubAllEnvs())
it('serves the configured root-level UTF-8 key with no indexing', async () => {
  vi.stubEnv('INDEXNOW_KEY', 'example-key-1234')
  const response = GET()
  expect(response.status).toBe(200)
  expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8')
  expect(response.headers.get('X-Robots-Tag')).toBe('noindex')
  expect(await response.text()).toBe('example-key-1234')
})
it('returns 404 for disabled or malformed keys', () => {
  for (const key of ['', 'short', 'invalid/key', 'a'.repeat(129)]) {
    vi.stubEnv('INDEXNOW_KEY', key)
    expect(GET().status).toBe(404)
  }
})
