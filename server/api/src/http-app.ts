import { createHash, timingSafeEqual } from 'node:crypto'
import type { Hono } from 'hono'

interface AppDependencies {
  cronSecret: string
  runIngestion(): Promise<{ batchId: string; itemCount: number }>
}

function matchesSecret(actual: string | undefined, expected: string): boolean {
  if (!actual?.startsWith('Bearer ') || expected.length === 0) return false

  const actualDigest = createHash('sha256').update(actual.slice(7)).digest()
  const expectedDigest = createHash('sha256').update(expected).digest()
  return timingSafeEqual(actualDigest, expectedDigest)
}

export function configureApp(app: Hono, deps: AppDependencies) {
  app.get('/health', (context) => context.json({ status: 'ok' as const }))

  app.post('/cron/juejin', async (context) => {
    if (!matchesSecret(context.req.header('Authorization'), deps.cronSecret)) {
      return context.json({ error: 'Unauthorized' }, 401)
    }

    try {
      return context.json(await deps.runIngestion())
    } catch {
      return context.json({ error: 'Juejin ingestion failed' }, 502)
    }
  })

  return app
}
