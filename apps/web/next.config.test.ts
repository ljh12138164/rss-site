import { describe, expect, it } from 'vitest'
import nextConfig from './next.config'

describe('security headers', () => {
  it('applies browser hardening policies to every route', async () => {
    const rules = (await nextConfig.headers?.()) ?? []
    const globalRule = rules.find((rule) => rule.source === '/:path*')
    const headers = Object.fromEntries(
      (globalRule?.headers ?? []).map((header) => [header.key, header.value])
    )

    expect(headers).toMatchObject({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'DENY',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    })
  })
})
