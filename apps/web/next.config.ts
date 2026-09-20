import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    cpus: 2,
    staticGenerationMaxConcurrency: 1,
    staticGenerationRetryCount: 3
  },
  serverExternalPackages: ['mtranserver'],
  outputFileTracingRoot: path.join(process.cwd(), '../..'),
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
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ]
      },
      {
        source:
          '/((?!api|_next|favicon\\.ico|icon\\.svg|ads\\.txt|robots\\.txt|sitemap\\.xml|indexnow\\.txt).*)',
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

export default nextConfig
