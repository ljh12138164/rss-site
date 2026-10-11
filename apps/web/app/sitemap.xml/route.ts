import { NextResponse } from 'next/server'
import { siteUrl } from '../../lib/site-url'
import { getSitemapXml, SITEMAP_CACHE_CONTROL } from '../../lib/sitemap-service'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!process.env.SITE_URL) return new NextResponse('Not Found', { status: 404 })

  try {
    return new NextResponse(await getSitemapXml(siteUrl('/'), null), {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': SITEMAP_CACHE_CONTROL
      }
    })
  } catch {
    return new NextResponse('Sitemap temporarily unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store', 'Retry-After': '60' }
    })
  }
}
