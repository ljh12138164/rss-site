import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { isReportDate } from '../../shared/daily-report'
import { articleSource, normalizeArticleSlugSegment } from './lib/article-route'
import { getContentStatus, getDailyReportStatus } from './lib/content-status'
import {
  isAiSourceId,
  isFinanceSourceId,
  isGameSourceId,
  isNewsSourceId,
  isSocialSourceId,
  isTechnologySourceId
} from './lib/technology-sources'

export async function proxy(request: NextRequest) {
  const [section, sourceId, encodedSlug] = request.nextUrl.pathname.split('/').filter(Boolean)
  if (section === 'daily') {
    let status = 404
    try {
      if (isReportDate(sourceId) && !encodedSlug) status = await getDailyReportStatus(sourceId)
    } catch {
      return new NextResponse('日报暂时无法加载，请稍后重试。', {
        status: 503,
        headers: {
          'Retry-After': '60',
          'Cache-Control': 'no-store',
          'Content-Type': 'text/plain; charset=utf-8'
        }
      })
    }
    return status === 200
      ? NextResponse.next()
      : new NextResponse('这一期日报不存在', {
          status: 404,
          headers: {
            'X-Robots-Tag': 'noindex',
            'Cache-Control': 'no-store',
            'Content-Type': 'text/plain; charset=utf-8'
          }
        })
  }
  if (section === 'ai' && sourceId === 'events' && (!encodedSlug || encodedSlug === 'archive'))
    return NextResponse.next()
  if (
    encodedSlug &&
    ((section === 'ai' && sourceId === 'events') || articleSource(sourceId)?.section.id === section)
  ) {
    const event = section === 'ai' && sourceId === 'events'
    let id: string
    if (event) {
      let slug: string
      try {
        slug = decodeURIComponent(encodedSlug)
      } catch {
        return new NextResponse('Not found', { status: 404 })
      }
      if (!slug || slug.length > 200 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
        return new NextResponse('Not found', { status: 404 })
      id = slug
    } else {
      const normalized = normalizeArticleSlugSegment(encodedSlug)
      if (normalized.kind === 'invalid') {
        return new NextResponse('Not found', {
          status: 404,
          headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' }
        })
      }
      if (normalized.kind === 'redirect') {
        const location = `/${section}/${encodeURIComponent(sourceId)}/${normalized.canonicalEncoded}${request.nextUrl.search}`
        return NextResponse.redirect(new URL(location, request.url), {
          status: 301,
          headers: {
            'Cache-Control': 'public, max-age=86400, s-maxage=86400'
          }
        })
      }
      id = normalized.id
    }
    try {
      const status = await getContentStatus(event ? 'event' : 'news', id, sourceId)
      if (status === 410)
        return new NextResponse('此内容已移除。', {
          status: 410,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Robots-Tag': 'noindex',
            'Cache-Control': 'no-store'
          }
        })
      if (status === 404)
        return new NextResponse('Not found', {
          status: 404,
          headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' }
        })
      return NextResponse.next()
    } catch {
      return new NextResponse('内容暂时无法加载，请稍后重试。', {
        status: 503,
        headers: {
          'Retry-After': '60',
          'Cache-Control': 'no-store',
          'Content-Type': 'text/plain; charset=utf-8'
        }
      })
    }
  }

  if (
    sourceId &&
    ((section === 'technology' && isTechnologySourceId(sourceId)) ||
      (section === 'news' && isNewsSourceId(sourceId)) ||
      (section === 'ai' && isAiSourceId(sourceId)) ||
      (section === 'social' && isSocialSourceId(sourceId)) ||
      (section === 'finance' && isFinanceSourceId(sourceId)) ||
      (section === 'games' && isGameSourceId(sourceId)))
  ) {
    return NextResponse.next()
  }

  return NextResponse.rewrite(new URL('/404', request.url), { status: 404 })
}

export const config = {
  matcher: [
    '/daily/:date',
    '/technology/:source',
    '/news/:source',
    '/ai/:source',
    '/social/:source',
    '/finance/:source',
    '/games/:source',
    '/ai/events/:slug',
    '/news/:source/:slug',
    '/ai/:source/:slug',
    '/technology/:source/:slug',
    '/social/:source/:slug',
    '/finance/:source/:slug',
    '/games/:source/:slug'
  ]
}
