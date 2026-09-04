import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { isAiSourceId, isNewsSourceId, isTechnologySourceId } from './lib/technology-sources'

export function proxy(request: NextRequest) {
  const [section, sourceId] = request.nextUrl.pathname.split('/').filter(Boolean)

  if (
    sourceId &&
    ((section === 'technology' && isTechnologySourceId(sourceId)) ||
      (section === 'news' && isNewsSourceId(sourceId)) ||
      (section === 'ai' && isAiSourceId(sourceId)))
  ) {
    return NextResponse.next()
  }

  return NextResponse.rewrite(new URL('/404', request.url), { status: 404 })
}

export const config = {
  matcher: ['/technology/:source', '/news/:source', '/ai/:source']
}
