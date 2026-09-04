import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { isTechnologySourceId } from './lib/technology-sources'

export function proxy(request: NextRequest) {
  const sourceId = request.nextUrl.pathname.split('/').filter(Boolean).at(-1)

  if (sourceId && isTechnologySourceId(sourceId)) {
    return NextResponse.next()
  }

  return NextResponse.rewrite(new URL('/404', request.url), { status: 404 })
}

export const config = {
  matcher: '/technology/:source'
}
