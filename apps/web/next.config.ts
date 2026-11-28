import path from 'node:path'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https: data: blob:",
  "media-src 'self' https: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "worker-src 'self' blob:",
  'upgrade-insecure-requests'
].join('; ')

const PUBLIC_DYNAMIC_CACHE_CONTROL = 'public, max-age=0, s-maxage=300, stale-while-revalidate=600'

const PUBLIC_DYNAMIC_CACHE_ROUTES = [
  '/',
  '/latest',
  '/daily',
  '/ai',
  '/technology',
  '/news',
  '/social',
  '/finance',
  '/games',
  '/github',
  '/skills',
  '/ai/events'
] as const

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  experimental: {
    cpus: 2,
    staticGenerationMaxConcurrency: 1,
    staticGenerationRetryCount: 3
  },
  serverExternalPackages: ['mtranserver'],
  transpilePackages: ['@rss-site/signals'],
  outputFileTracingRoot: path.join(process.cwd(), '../..'),
  async redirects() {
    return [
      {
        source: '/rss.xml',
        destination: '/feeds/ai.xml',
        statusCode: 301
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: '/stats/:match*',
        destination: 'https://analytics.ljhboard.cn/:match*'
      }
    ]
  },
  async headers() {
    return [
      ...PUBLIC_DYNAMIC_CACHE_ROUTES.map((source) => ({
        source,
        headers: [{ key: 'Cache-Control', value: PUBLIC_DYNAMIC_CACHE_CONTROL }]
      })),
      {
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'no-store' }]
      },
      {
        source: '/archive/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
      },
      {
        source: '/ai/events/archive',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ]
      },
      {
        source:
          '/((?!api|_next|favicon\\.ico|icon\\.svg|ads\\.txt|robots\\.txt|sitemap\\.xml|indexnow\\.txt|manifest\\.webmanifest).*)',
        headers: [
          {
            key: 'Link',
            value: '__EARLY_HINTS_LINK_PLACEHOLDER__'
          }
        ]
      }
    ]
  }
}

export default withNextIntl(nextConfig)
