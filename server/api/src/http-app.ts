import { createHash, timingSafeEqual } from 'node:crypto'
import type { Context, Hono } from 'hono'
import { isTechnologySourceId, type TechnologySourceId } from './technology/sources.js'

interface AppDependencies {
  cronSecret: string
  runIngestion(source: TechnologySourceId): Promise<{ batchId: string; itemCount: number }>
}

function matchesSecret(actual: string | undefined, expected: string): boolean {
  if (!actual?.startsWith('Bearer ') || expected.length === 0) return false

  const actualDigest = createHash('sha256').update(actual.slice(7)).digest()
  const expectedDigest = createHash('sha256').update(expected).digest()
  return timingSafeEqual(actualDigest, expectedDigest)
}

export function configureApp(app: Hono, deps: AppDependencies) {
  app.get('/health', (context) => context.json({ status: 'ok' as const }))

  async function runIngestion(context: Context, source: string) {
    if (!matchesSecret(context.req.header('Authorization'), deps.cronSecret)) {
      return context.json({ error: 'Unauthorized' }, 401)
    }

    if (!isTechnologySourceId(source)) {
      return context.json({ error: 'Unknown technology source' }, 404)
    }

    try {
      return context.json(await deps.runIngestion(source))
    } catch {
      return context.json({ error: 'Technology ingestion failed' }, 502)
    }
  }

  app.post('/cron/technology/:source', (context) =>
    runIngestion(context, context.req.param('source'))
  )
  app.post('/cron/juejin', (context) => runIngestion(context, 'juejin'))

  return app
}
