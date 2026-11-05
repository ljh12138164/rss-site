import { ingestionApp } from '../../../lib/ingestion-app'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function handle(request: Request) {
  const url = new URL(request.url)
  url.pathname = '/mcp'
  return ingestionApp().fetch(new Request(url, request))
}

export const GET = handle
export const POST = handle
export const OPTIONS = handle
