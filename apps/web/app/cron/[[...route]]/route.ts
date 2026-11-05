import { ingestionApp } from '../../../lib/ingestion-app'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: Request) {
  return ingestionApp().fetch(request)
}
