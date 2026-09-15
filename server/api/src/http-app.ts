import { createHash, timingSafeEqual } from 'node:crypto'
import type { Context, Hono } from 'hono'
import { handleMcpJsonRpc } from './mcp/handler.js'
import type { McpNewsItem } from './mcp/service.js'
import {
  getSignalSource,
  isSignalSourceId,
  type SignalSection,
  type SignalSourceId
} from './technology/sources.js'

export interface AppDependencies {
  cronSecret: string
  runIngestion(source: SignalSourceId): Promise<{ batchId: string; itemCount: number }>
  fetchNews?(options: { platform?: string; limit?: number }): Promise<McpNewsItem[]>
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-mcp-version'
}

function matchesSecret(actual: string | undefined, expected: string): boolean {
  if (!actual?.startsWith('Bearer ') || expected.length === 0) return false

  const actualDigest = createHash('sha256').update(actual.slice(7)).digest()
  const expectedDigest = createHash('sha256').update(expected).digest()
  return timingSafeEqual(actualDigest, expectedDigest)
}

export function configureApp(app: Hono, deps: AppDependencies) {
  app.get('/health', (context) => context.json({ status: 'ok' as const }))

  // MCP CORS preflight
  app.options('/mcp', () => new Response(null, { status: 204, headers: corsHeaders }))
  app.options('/api/news', () => new Response(null, { status: 204, headers: corsHeaders }))

  // MCP Streamable HTTP & SSE endpoints
  app.get(
    '/mcp',
    () =>
      new Response('event: endpoint\ndata: /mcp\n\n', {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          ...corsHeaders
        }
      })
  )

  app.get(
    '/sse',
    () =>
      new Response('event: endpoint\ndata: /mcp\n\n', {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          ...corsHeaders
        }
      })
  )

  app.post('/mcp', async (context) => {
    let body: unknown
    try {
      body = await context.req.json()
    } catch {
      return context.json(
        { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
        400,
        corsHeaders
      )
    }

    const fetchNews = deps.fetchNews ?? (async () => [])
    const response = await handleMcpJsonRpc(body, { fetchNews })

    if (!response) {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    return context.json(response, 200, corsHeaders)
  })

  // REST helper endpoint for quick verification / curl
  app.get('/api/news', async (context) => {
    const platform = context.req.query('platform')
    const limitQuery = context.req.query('limit')
    const limit = limitQuery ? Number.parseInt(limitQuery, 10) : undefined

    const fetchNews = deps.fetchNews ?? (async () => [])
    const items = await fetchNews({ platform, limit })

    return context.json(
      {
        items,
        total: items.length,
        platform: platform ?? null
      },
      200,
      corsHeaders
    )
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
