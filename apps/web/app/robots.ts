import type { MetadataRoute } from 'next'
import { optionalCanonical } from '../lib/site-url'

const DISALLOW_PATHS = [
  '/api/',
  '/cron/',
  '/out',
  '/admin',
  '/archive',
  '/ai/events/archive',
  '/reading-list',
  '/following'
]

const EXPLICIT_SEARCH_AND_AI_BOTS = [
  'Baiduspider',
  'Googlebot',
  'Bingbot',
  'Applebot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'Perplexity-User',
  'Claude-SearchBot',
  'Claude-User'
]

export default function robots(): MetadataRoute.Robots {
  const sitemap = optionalCanonical('/sitemap.xml')
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOW_PATHS
      },
      {
        userAgent: EXPLICIT_SEARCH_AND_AI_BOTS,
        allow: '/',
        disallow: DISALLOW_PATHS
      }
    ],
    ...(sitemap ? { sitemap } : {})
  }
}
