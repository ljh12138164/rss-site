import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from '../../../server/api/src/db/schema'
import { DrizzleSignalStore } from '../../../server/api/src/ingestion/store'
import { type DailySource, validateDailyDraft } from '../../../shared/daily-report'
import fixture from '../../../shared/daily-report.fixture.json'
import type { FrozenInput } from '../../../shared/daily-repository'
import { editAdminArticle } from '../lib/business-admin'
import { getBusinessDatabase } from '../lib/business-db'
import { readArticle, readEvents, readSectionFeed } from '../lib/business-queries'
import { DailyReportRepository } from '../lib/daily-repository'
import { internalService } from '../lib/internal-service'

async function main() {
  if (process.env.MIGRATION_REHEARSAL !== 'true') throw new Error('Rehearsal only')
  const { client } = getBusinessDatabase()
  const [version] =
    await client`select current_setting('server_version_num')::int as version,current_user as role`
  assert(version.version >= 180000 && version.version < 190000)
  assert.equal(version.role, 'rss_site_app')
  const [{ superuser, createdb, createrole }] =
    await client`select rolsuper as superuser,rolcreatedb as createdb,rolcreaterole as createrole from pg_roles where rolname=current_user`
  assert.deepEqual([superuser, createdb, createrole], [false, false, false])
  assert((await readSectionFeed('technology', ['juejin'])).items.length > 0)
  assert((await readEvents(null, new Date().toISOString())).length > 0)
  const key = `migration-rehearsal-${randomUUID()}`
  const started = new Date()
  const db = drizzle({ client, schema })
  // Preserve the actual source ranking by testing the writer inside a rolled-back transaction.
  const rollback = new Error('rollback_rehearsal')
  try {
    await db.transaction(async (tx) => {
      const probe = new DrizzleSignalStore(tx as unknown as typeof db, 'juejin', 'technology')
      await probe.replaceRanking({
        batchId: randomUUID(),
        startedAt: started,
        finishedAt: new Date(),
        items: [
          {
            sourceKey: key,
            title: 'Migration original title',
            url: 'https://example.com/rehearsal',
            summary:
              'A meaningful source summary with enough text to be indexed and verified during migration.',
            contentHtml: '<p>Verified real PostgreSQL ingestion content.</p>',
            author: null,
            publishedAt: started,
            position: 1,
            imageUrl: null
          }
        ]
      })
      const [row] = await tx
        .select()
        .from(schema.signalArticles)
        .where((await import('drizzle-orm')).eq(schema.signalArticles.sourceKey, key))
      assert(row && row.publishedAt instanceof Date)
      throw rollback
    })
  } catch (error) {
    if (error !== rollback) throw error
  }
  // Dedicated fixture is cleaned explicitly and never targets an upstream article.
  const [article] =
    await client`insert into signal_articles(section,source,source_key,title,url,summary) values('technology','juejin',${key},'Migration original title','https://example.com/rehearsal','Verified content for the editorial lock regression with enough meaningful text.') returning id`
  try {
    const found = await readArticle(article.id, 'technology', 'juejin')
    assert.equal(found?.id, article.id)
    await editAdminArticle(article.id, {
      title: 'Migration edited title',
      summary: 'Edited summary',
      contentHtml: '<p>Edited body</p>',
      imageUrl: null,
      author: null,
      publishedAt: null,
      isPinned: false
    })
    await client`update signal_articles set title='Upstream replacement' where id=${article.id}`
    const [edited] =
      await client`select title,editorial_locked from signal_articles where id=${article.id}`
    assert.equal(edited.title, 'Migration edited title')
    assert.equal(edited.editorial_locked, true)
  } finally {
    await client`delete from signal_articles where id=${article.id}`
  }
  const [notice] =
    await client`select id from private.publication_outbox where payload->>'id'=${article.id}`
  assert(notice)
  await client`delete from private.publication_outbox where id=${notice.id}`
  await client`delete from content_tombstones where kind='news' and key=${`juejin/${article.id}`}`
  const repo = new DailyReportRepository()
  const day = '2001-01-01'
  const input: FrozenInput = {
    materials: (fixture.sources as DailySource[]).map((s) => ({
      ...s,
      text: 'Fixture material',
      isExcerpt: false
    })),
    prompt: 'fixture',
    userInput: 'fixture',
    hash: 'a'.repeat(64),
    promptVersion: 'fixture'
  }
  const draft = validateDailyDraft(fixture.draft, input.materials)
  assert.equal(await repo.status(day), undefined)
  try {
    const submits = await Promise.all(Array.from({ length: 8 }, () => repo.submit(day)))
    assert.equal(new Set(submits.map((j) => j?.id)).size, 1)
    const claims = await Promise.all([repo.claim(), repo.claim()])
    assert.equal(claims.filter(Boolean).length, 1)
    const job = claims.find(Boolean)
    assert.ok(job)
    assert.equal(job.report_date, day)
    await repo.freeze(job, input, new Date())
    await client`update daily_report_jobs set lease_until=now()-interval '1 second' where report_date=${day}`
    const next = await repo.claim()
    assert(next)
    assert.notEqual(next.run_token, job.run_token)
    assert.equal(await repo.heartbeat(job), false)
    await assert.rejects(repo.publish(job, input, draft, {}), /lease_lost/)
    await repo.publish(next, input, draft, { model: 'rehearsal' })
    assert.equal((await repo.status(day))?.status, 'published')
    await assert.rejects(repo.publish(next, input, draft, {}), /lease_lost/)
    const notification = await repo.claimNotification()
    assert(notification)
    await repo.finishNotification(notification, true)
  } finally {
    await client`delete from daily_reports where report_date=${day}`
    await client`delete from daily_report_jobs where report_date=${day}`
  }
  process.env.AGENT_SERVICE_TOKEN = 'migration-rehearsal-token'
  const api = internalService()
  assert.equal((await api.request('/api/internal/agent', { method: 'POST' })).status, 401)
  assert.equal(
    (
      await api.request('/api/internal/agent', {
        method: 'POST',
        headers: {
          authorization: 'Bearer migration-rehearsal-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ operation: 'status', date: day })
      })
    ).status,
    200
  )
  console.log(
    JSON.stringify({
      postgresMajor: 18,
      applicationRole: true,
      queries: true,
      ingestionRollback: true,
      editorialLock: true,
      deletionOutbox: true,
      dailyConcurrency: true,
      leaseRecovery: true,
      atomicPublication: true,
      internalAuth: true
    })
  )
  await client.end()
}
main().catch((error) => {
  console.error(
    'PostgreSQL migration verification failed:',
    error instanceof Error ? error.stack : 'unknown'
  )
  process.exit(1)
})
