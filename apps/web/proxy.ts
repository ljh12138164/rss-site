import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { parseArticleIdFromSlug } from './lib/article-route'
import { getContentStatus } from './lib/content-status'
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
  if (section === 'ai' && sourceId === 'events' && !encodedSlug) return NextResponse.next()
  if (
    encodedSlug &&
    ((section === 'ai' && sourceId === 'events') ||
      (section === 'news' && isNewsSourceId(sourceId)))
  ) {
    let slug: string
    try {
      slug = decodeURIComponent(encodedSlug)
    } catch {
      return new NextResponse('Not found', { status: 404 })
    }
    const event = section === 'ai'
    const id = event ? slug : parseArticleIdFromSlug(slug)
    if (!id || (event && (slug.length > 200 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))))
      return new NextResponse('Not found', { status: 404 })
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
    '/technology/:source',
    '/news/:source',
    '/ai/:source',
    '/social/:source',
    '/finance/:source',
    '/games/:source',
    '/ai/events/:slug',
    '/news/:source/:slug'
  ]
}
