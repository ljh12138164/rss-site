import { createHash, timingSafeEqual } from 'node:crypto'
import {
  getSignalSource,
  isSignalSourceId,
  type SignalSection,
  type SignalSourceId
} from '@rss-site/signals'
import type { Context, Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { cors } from 'hono/cors'
import {
  type DailyReportSubmission,
  parseDailySubmission,
  type submitDailyReport
} from './daily-report.js'
import { RefreshError } from './maintenance/zhihu.js'
import type { CookieRefreshResult } from './maintenance/zhihu-cookie.js'
import { handleMcpJsonRpc } from './mcp/handler.js'
import type { McpNewsItem } from './mcp/service.js'

export interface AppDependencies {
  cronSecret: string
  runIngestion(source: SignalSourceId): Promise<{ batchId: string; itemCount: number }>
  fetchNews?(options: { platform?: string; limit?: number }): Promise<McpNewsItem[]>
  refreshZhihuCookie?(): Promise<CookieRefreshResult>
  submitDailyReport?(input: DailyReportSubmission): ReturnType<typeof submitDailyReport>
}

function matchesSecret(actual: string | undefined, expected: string): boolean {
  if (!actual?.startsWith('Bearer ') || expected.length === 0) return false

  const actualDigest = createHash('sha256').update(actual.slice(7)).digest()
  const expectedDigest = createHash('sha256').update(expected).digest()
  return timingSafeEqual(actualDigest, expectedDigest)
}

export function configureApp(app: Hono, deps: AppDependencies) {
  app.get('/health', (context) => context.json({ status: 'ok' as const }))

  app.use('/cron/daily-report', bodyLimit({ maxSize: 1024 }))
  app.post('/cron/daily-report', async (context) => {
    if (!matchesSecret(context.req.header('Authorization'), deps.cronSecret))
      return context.json({ error: 'Unauthorized' }, 401)
    if (
      context.req.header('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json'
    )
      return context.json({ error: 'Use application/json' }, 415)
    let input: DailyReportSubmission
    try {
      input = parseDailySubmission(await context.req.json())
    } catch {
      return context.json({ error: 'Invalid daily report input' }, 400)
    }
    if (!deps.submitDailyReport)
      return context.json({ error: 'Daily reports are not configured' }, 503)
    try {
      const result = await deps.submitDailyReport(input)
      return context.json(result.data, result.status)
    } catch {
      return context.json({ error: 'Daily report submission unavailable' }, 503)
    }
  })

  app.post('/cron/maintenance/zhihu-cookie', async (context) => {
    if (!matchesSecret(context.req.header('Authorization'), deps.cronSecret)) {
      return context.json({ error: 'Unauthorized' }, 401)
    }
    if (!deps.refreshZhihuCookie)
      return context.json({ error: 'Cookie refresh is not configured' }, 503)
    try {
      const result = await deps.refreshZhihuCookie()
      return context.json(result, result.status === 'deployment_pending' ? 202 : 200)
    } catch (error) {
      return context.json(
        {
          error: 'Cookie refresh failed',
          code: error instanceof RefreshError ? error.code : 'request_failed'
        },
        502
      )
    }
  })

  // Standard Hono CORS middleware for MCP endpoint
  app.use(
    '/mcp',
    cors({
      origin: '*',
      allowMethods: ['POST', 'GET', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'x-mcp-version']
    })
  )

  // MCP Streamable HTTP service status
  app.get('/mcp', (context) =>
    context.json({
      name: 'rss-site-mcp',
      version: '1.0.0',
      status: 'ready',
      protocol: 'mcp'
    })
  )

  // MCP Streamable HTTP JSON-RPC 2.0 endpoint
  app.post('/mcp', async (context) => {
    let body: unknown
    try {
      body = await context.req.json()
    } catch {
      return context.json(
        { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
        400
      )
    }

    const fetchNews = deps.fetchNews ?? (async () => [])
    const response = await handleMcpJsonRpc(body, { fetchNews })

    if (!response) {
      return new Response(null, { status: 204 })
    }

    return context.json(response, 200)
  })

  async function runIngestion(context: Context, source: string, section?: SignalSection) {
    if (!matchesSecret(context.req.header('Authorization'), deps.cronSecret)) {
      return context.json({ error: 'Unauthorized' }, 401)
    }

    if (!isSignalSourceId(source) || (section && getSignalSource(source).section !== section)) {
      return context.json({ error: 'Unknown signal source' }, 404)
    }

    try {
      return context.json(await deps.runIngestion(source))
    } catch {
      return context.json({ error: 'Signal ingestion failed' }, 502)
    }
  }

  app.post('/cron/technology/:source', (context) =>
    runIngestion(context, context.req.param('source'), 'technology')
  )
  app.post('/cron/news/:source', (context) =>
    runIngestion(context, context.req.param('source'), 'news')
  )
  app.post('/cron/ai/:source', (context) =>
    runIngestion(context, context.req.param('source'), 'ai')
  )
  app.post('/cron/social/:source', (context) =>
    runIngestion(context, context.req.param('source'), 'social')
  )
  app.post('/cron/finance/:source', (context) =>
    runIngestion(context, context.req.param('source'), 'finance')
  )
  app.post('/cron/games/:source', (context) =>
    runIngestion(context, context.req.param('source'), 'games')
  )
  app.post('/cron/signals/:source', (context) => runIngestion(context, context.req.param('source')))
  app.post('/cron/juejin', (context) => runIngestion(context, 'juejin'))

  return app
}
