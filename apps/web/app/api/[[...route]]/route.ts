import { handle } from 'hono/vercel'
import { app } from '../../../lib/hono-app'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export const GET = handle(app)
export const POST = handle(app)
export const PATCH = handle(app)
