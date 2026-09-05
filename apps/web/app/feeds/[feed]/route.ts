import {
  loadRssSection,
  parseRssFeedName,
  type RssSectionData,
  type RssSectionId,
  renderRssSectionXml
} from '@/lib/rss-feed'

export const dynamic = 'force-dynamic'

type RssSectionLoader = (section: RssSectionId) => Promise<RssSectionData>

const successHeaders = {
  'Cache-Control': 'public, max-age=300, s-maxage=1800, stale-while-revalidate=300',
  'Content-Type': 'application/rss+xml; charset=utf-8',
  'X-Content-Type-Options': 'nosniff'
}

export async function createRssResponse(
  request: Request,
  feedName: string,
  load: RssSectionLoader = loadRssSection
): Promise<Response> {
  const section = parseRssFeedName(feedName)

  if (!section) {
    return new Response('RSS feed not found', {
      status: 404,
      headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' }
    })
  }

  try {
    const data = await load(section)

    if (data.unavailable) {
      return new Response('RSS feed is temporarily unavailable', {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'text/plain; charset=utf-8',
          'Retry-After': '300'
        }
      })
    }

    return new Response(renderRssSectionXml(data, new URL(request.url).origin), {
      headers: successHeaders
    })
  } catch {
    return new Response('RSS feed is temporarily unavailable', {
      status: 503,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain; charset=utf-8',
        'Retry-After': '300'
      }
    })
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ feed: string }> }
): Promise<Response> {
  const { feed } = await params
  return createRssResponse(request, feed)
}
