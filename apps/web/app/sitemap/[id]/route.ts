import { NextResponse } from 'next/server'
import { siteUrl } from '../../../lib/site-url'
import { getSitemapXml, SITEMAP_CACHE_CONTROL } from '../../../lib/sitemap-service'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  if (!process.env.SITE_URL) return new NextResponse('Not Found', { status: 404 })

  const { id } = await props.params
  if (!/^(0|[1-9]\d*)(?:\.xml)?$/.test(id)) return new NextResponse('Not Found', { status: 404 })
  const chunk = Number(id.replace(/\.xml$/, ''))
  if (!Number.isSafeInteger(chunk)) return new NextResponse('Not Found', { status: 404 })
  try {
    const xml = await getSitemapXml(siteUrl('/'), chunk)
    if (xml === null) return new NextResponse('Not Found', { status: 404 })
    return new NextResponse(xml, {
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
