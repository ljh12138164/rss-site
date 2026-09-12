import { handle } from 'hono/vercel'
import { app } from '../../../lib/hono-app'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export const POST = handle(app)
