import { findSignalSource, type SignalSourceId } from '@rss-site/signals'
import {
  loadRssSection,
  loadRssSources,
  parseRssFeedName,
  type RssSectionData,
  type RssSectionId,
  renderRssSectionXml
} from '@/lib/rss-feed'
import { parseRssSources } from '@/lib/rss-selection'

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
  load: RssSectionLoader = loadRssSection,
  loadSources: (sources: SignalSourceId[]) => Promise<RssSectionData> = loadRssSources
): Promise<Response> {
  const section = parseRssFeedName(feedName)
  let selected: SignalSourceId[] | undefined
  if (feedName === 'custom.xml') {
    try {
      selected = parseRssSources(new URL(request.url).searchParams.get('sources'))
    } catch {
      return new Response('Invalid RSS sources', {
        status: 400,
        headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' }
      })
    }
  } else if (!section && feedName.endsWith('.xml')) {
    const source = findSignalSource(feedName.slice(0, -4))
    if (source?.isArticle) selected = [source.id]
  }

  if (!section && !selected) {
    return new Response('RSS feed not found', {
      status: 404,
      headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' }
    })
  }

  try {
    const data = selected ? await loadSources(selected) : await load(section as RssSectionId)

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
