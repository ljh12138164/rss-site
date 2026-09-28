import { afterEach, describe, expect, it, vi } from 'vitest'
import robots from './robots'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('robots metadata', () => {
  it('omits the sitemap when SITE_URL is not configured', () => {
    vi.stubEnv('SITE_URL', '')

    expect(robots()).toEqual({
      rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/cron/', '/out', '/admin'] }
    })
  })

  it('includes the absolute sitemap URL when SITE_URL is configured', () => {
    vi.stubEnv('SITE_URL', 'https://news.example')

    expect(robots()).toEqual({
      rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/cron/', '/out', '/admin'] },
      sitemap: 'https://news.example/sitemap.xml'
    })
  })
})
