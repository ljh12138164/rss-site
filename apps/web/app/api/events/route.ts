import { getEventPage, parseEventCursor } from '../../../lib/ai-events'

export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  const cursor = new URL(request.url).searchParams.get('cursor')
  try {
    parseEventCursor(cursor)
  } catch {
    return Response.json({ error: 'Invalid cursor' }, { status: 400 })
  }
  try {
    return Response.json(await getEventPage(cursor), { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ error: 'Events unavailable' }, { status: 503 })
  }
}
