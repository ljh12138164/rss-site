import { sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import {
  dailySections,
  isReportDate,
  safeDailyUrl,
  validateDailyDraft
} from '../../../shared/daily-report'
import type { FrozenInput } from '../../../shared/daily-repository'
import { validSkillId } from '../../../shared/skills'
import { getBusinessDatabase, readBusinessRows } from './business-db'
import { DailyReportRepository } from './daily-repository'
import { matchesServiceToken } from './service-auth'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid_input')
  return value as Record<string, unknown>
}
function date(value: unknown) {
  if (!isReportDate(value)) throw new Error('invalid_input')
  return value
}
function identifier(value: unknown) {
  if (typeof value !== 'string' || !uuid.test(value)) throw new Error('invalid_input')
  return value
}
function job(value: unknown) {
  const row = record(value)
  return {
    id: identifier(row.id),
    report_date: date(row.report_date),
    run_token: row.run_token === null ? '' : identifier(row.run_token),
    notification_attempts:
      Number.isInteger(row.notification_attempts) && Number(row.notification_attempts) >= 0
        ? Number(row.notification_attempts)
        : 0
  }
}
function timestamp(value: unknown) {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value)))
    throw new Error('invalid_input')
  return new Date(value)
}
async function recordHotRankingGeneration(input: Record<string, unknown>) {
  const { phase, articleIds, model, elapsedMs, status, issueCode, result, resultTruncated } = input
  if (
    (phase !== 'analysis' && phase !== 'review') ||
    !Array.isArray(articleIds) ||
    articleIds.length < 1 ||
    articleIds.length > 6 ||
    typeof model !== 'string' ||
    !/^[a-z0-9.-]{1,100}$/i.test(model) ||
    typeof elapsedMs !== 'number' ||
    !Number.isInteger(elapsedMs) ||
    elapsedMs < 0 ||
    elapsedMs > 300000 ||
    (status !== 'ok' && status !== 'recovered' && status !== 'failed') ||
    (status === 'ok'
      ? issueCode !== null
      : typeof issueCode !== 'string' || !/^[a-z][a-z0-9_]{0,79}$/.test(issueCode)) ||
    (result === null
      ? status !== 'failed'
      : typeof result !== 'string' || result.includes('\0') || Buffer.byteLength(result) > 32768) ||
    typeof resultTruncated !== 'boolean' ||
    (resultTruncated && result === null)
  )
    throw new Error('invalid_input')
  const batchId = identifier(input.batchId)
  const ids = articleIds.map(identifier)
  if (new Set(ids).size !== ids.length) throw new Error('invalid_input')
  const startedAt = timestamp(input.startedAt)
  await readBusinessRows(sql`insert into private.hot_ranking_generations
    (batch_id,phase,article_ids,model,started_at,elapsed_ms,status,issue_code,result,result_truncated)
    values (${batchId}::uuid,${phase},array[${sql.join(
      ids.map((id) => sql`${id}::uuid`),
      sql`, `
    )}],
      ${model},${startedAt.toISOString()}::timestamptz,${elapsedMs},${status},${issueCode},${result},${resultTruncated})
    on conflict do nothing`)
  return true
}
function frozen(value: unknown): FrozenInput {
  const row = record(value)
  if (
    !Array.isArray(row.materials) ||
    row.materials.length > 48 ||
    typeof row.prompt !== 'string' ||
    typeof row.userInput !== 'string' ||
    typeof row.hash !== 'string' ||
    !/^[a-f0-9]{64}$/.test(row.hash) ||
    typeof row.promptVersion !== 'string' ||
    row.promptVersion.length > 100
  )
    throw new Error('invalid_input')
  for (const value of row.materials) {
    const item = record(value)
    identifier(item.id)
    if (
      typeof item.source !== 'string' ||
      typeof item.sourceName !== 'string' ||
      typeof item.title !== 'string' ||
      !safeDailyUrl(item.url) ||
      !dailySections.includes(item.section as (typeof dailySections)[number]) ||
      typeof item.text !== 'string' ||
      typeof item.isExcerpt !== 'boolean' ||
      (item.imageUrl !== null && !safeDailyUrl(item.imageUrl))
    )
      throw new Error('invalid_input')
    timestamp(item.firstSeenAt)
    if (item.publishedAt !== null) timestamp(item.publishedAt)
  }
  return row as unknown as FrozenInput
}

export function internalService(repository = new DailyReportRepository()) {
  const app = new Hono()
  app.use('*', async (c, next) => {
    if (!matchesServiceToken(c.req.raw, process.env.AGENT_SERVICE_TOKEN))
      return c.json({ error: 'Unauthorized' }, 401)
    await next()
  })
  app.use('*', bodyLimit({ maxSize: 2 * 1024 * 1024 }))
  app.post('/api/internal/agent', async (c) => {
    let input: Record<string, unknown>
    try {
      input = record(await c.req.json())
    } catch {
      return c.json({ error: 'invalid_input' }, 400)
    }
    try {
      let result: unknown
      switch (input.operation) {
        case 'recordHotRankingGeneration':
          result = await recordHotRankingGeneration(input)
          break
        case 'article': {
          const id = identifier(input.id)
          const [article] = await readBusinessRows(
            sql`select id,title,summary,content_html as "contentHtml" from public.signal_articles where id=${id}::uuid limit 1`
          )
          result = article ?? null
          break
        }
        case 'skill': {
          if (typeof input.id !== 'string' || !validSkillId(input.id))
            throw new Error('invalid_input')
          const [skill] = await readBusinessRows(
            sql`select name as title,skill_markdown as markdown from public.skill_details where skill_id=${input.id} limit 1`
          )
          result = skill ?? null
          break
        }
        case 'submit': {
          if (input.retry !== undefined && typeof input.retry !== 'boolean')
            throw new Error('invalid_input')
          if (input.trigger !== 'auto' && input.trigger !== 'manual')
            throw new Error('invalid_input')
          result = await repository.submit(date(input.date), input.retry === true, input.trigger)
          break
        }
        case 'status':
          result = await repository.status(date(input.date))
          break
        case 'claim':
          result = await repository.claim()
          break
        case 'heartbeat':
          result = await repository.heartbeat(job(input.job))
          break
        case 'candidates':
          result = await repository.candidates(job(input.job), timestamp(input.snapshotAt))
          break
        case 'history':
          result = await repository.history(date(input.date))
          break
        case 'freeze':
          result = await repository.freeze(
            job(input.job),
            frozen(input.input),
            timestamp(input.snapshotAt)
          )
          break
        case 'release':
          result = await repository.release(job(input.job))
          break
        case 'finish': {
          if (
            !['no_material', 'no_news', 'failed'].includes(String(input.status)) ||
            (input.code !== null && (typeof input.code !== 'string' || input.code.length > 100)) ||
            typeof input.retry !== 'boolean'
          )
            throw new Error('invalid_input')
          result = await repository.finish(
            job(input.job),
            input.status as 'no_material' | 'no_news' | 'failed',
            input.code as string | null,
            input.retry,
            input.metrics === undefined ? undefined : record(input.metrics)
          )
          break
        }
        case 'publish': {
          const handle = job(input.job)
          const client = getBusinessDatabase().client
          const [saved] = await client<
            { input_snapshot: FrozenInput }[]
          >`select input_snapshot from daily_report_jobs where report_date=${handle.report_date} and run_token=${handle.run_token} and status='running' and lease_until>now()`
          if (!saved?.input_snapshot) throw new Error('lease_lost')
          const draft = validateDailyDraft(input.draft, saved.input_snapshot.materials)
          result = await repository.publish(
            handle,
            saved.input_snapshot,
            draft,
            record(input.metrics)
          )
          break
        }
        case 'claimNotification':
          result = await repository.claimNotification()
          break
        case 'finishNotification': {
          if (typeof input.ok !== 'boolean') throw new Error('invalid_input')
          result = await repository.finishNotification(job(input.job), input.ok)
          break
        }
        default:
          return c.json({ error: 'invalid_operation' }, 400)
      }
      return c.json({ result: result ?? null })
    } catch (error) {
      if (error instanceof Error && error.message === 'lease_lost')
        return c.json({ error: 'lease_lost' }, 409)
      if (
        error instanceof Error &&
        (error.message === 'invalid_input' || error.message.startsWith('Invalid daily report'))
      )
        return c.json({ error: 'invalid_input' }, 400)
      return c.json({ error: 'repository_unavailable' }, 503)
    }
  })
  return app
}
