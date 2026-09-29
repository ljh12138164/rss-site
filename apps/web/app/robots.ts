import type { MetadataRoute } from 'next'
import { optionalCanonical } from '../lib/site-url'

export default function robots(): MetadataRoute.Robots {
  const sitemap = optionalCanonical('/sitemap.xml')
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/cron/', '/out', '/admin'] },
    ...(sitemap ? { sitemap } : {})
  }
}
