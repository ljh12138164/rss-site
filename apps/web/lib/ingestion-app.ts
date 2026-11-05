import { getSignalSource } from '@rss-site/signals'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { configureApp } from '../../../server/api/src/http-app'
import { runIngestionPipeline } from '../../../server/api/src/ingestion/pipeline'
import { fetchMcpNews } from '../../../server/api/src/mcp/service'
import { PostgresCronRepository } from '../../../server/api/src/setup/postgres-repository'
import { getBusinessDatabase } from './business-db'
import {
  drainPublicationOutbox,
  refreshBusinessCookie,
  retainBusinessData
} from './business-maintenance'
import { matchesServiceToken } from './service-auth'

function database() {
  return getBusinessDatabase().db
}

export function ingestionApp() {
  const app = new Hono()
  app.post('/cron/verify/:source', bodyLimit({ maxSize: 16 * 1024 }), async (c) => {
    if (!matchesServiceToken(c.req.raw, process.env.CRON_SECRET))
      return c.json({ error: 'Unauthorized' }, 401)
    let source: ReturnType<typeof getSignalSource>
    let batchId: string
    let itemCount: number
    try {
      source = getSignalSource(c.req.param('source') as Parameters<typeof getSignalSource>[0])
      const body = await c.req.json()
      if (
        typeof body.batchId !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.batchId) ||
        !Number.isInteger(body.itemCount) ||
        body.itemCount < 1
      )
        throw new Error('invalid_input')
      batchId = body.batchId
      itemCount = body.itemCount
    } catch {
      return c.json({ error: 'invalid_input' }, 400)
    }
    try {
      await new PostgresCronRepository(getBusinessDatabase().client).verifyIngestion({
        source: source.id,
        section: source.section,
        batchId,
        itemCount
      })
      return c.json({ verified: true, databaseMajor: 18 })
    } catch {
      return c.json({ error: 'target_verification_failed' }, 503)
    }
  })
  app.post('/cron/maintenance/:task', async (c, next) => {
    if (c.req.param('task') === 'zhihu-cookie') return next()
    if (!matchesServiceToken(c.req.raw, process.env.CRON_SECRET))
      return c.json({ error: 'Unauthorized' }, 401)
    try {
      if (c.req.param('task') === 'retention') return c.json(await retainBusinessData())
      if (c.req.param('task') === 'publication-outbox')
        return c.json(await drainPublicationOutbox())
      return c.json({ error: 'Unknown maintenance task' }, 404)
    } catch {
      return c.json({ error: 'Maintenance failed' }, 503)
    }
  })
  return configureApp(app, {
    cronSecret: process.env.CRON_SECRET ?? '',
    refreshZhihuCookie: refreshBusinessCookie,
    fetchNews: (options) => fetchMcpNews(database(), options),
    runIngestion: (id) =>
      runIngestionPipeline(getSignalSource(id), {
        db: database(),
        rsshubBaseUrl: process.env.RSSHUB_BASE_URL ?? 'https://rss.ljhboard.cn',
        webAppUrl: `http://127.0.0.1:${process.env.PORT ?? '3000'}`,
        revalidateSecret: process.env.REVALIDATE_SECRET
      })
  })
}
