import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  serverExternalPackages: ['mtranserver'],
  outputFileTracingRoot: path.join(process.cwd(), '../..'),
  async headers() {
    return [
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
