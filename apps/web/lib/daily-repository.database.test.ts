import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { FrozenInput } from '../../../shared/daily-repository'
import { DailyReportRepository } from './daily-repository'

// Opt in explicitly: creates only a private, randomly named schema and removes it after testing.
// Apply rss-site's migration first. The public jobs/reports tables receive no fixture rows.
describe.skipIf(!process.env.DAILY_REPORT_TEST_DATABASE_URL)(
  'daily jobs against real PostgreSQL',
  () => {
    const schema = `daily_test_${randomUUID().replaceAll('-', '')}`
    const url = process.env.DAILY_REPORT_TEST_DATABASE_URL ?? ''
    const admin = postgres(url, {
      prepare: false,
      max: 1,
      connect_timeout: 10
    })
    const sql = postgres(url, {
      prepare: false,
      max: 4,
      connect_timeout: 10,
      connection: {
        search_path: `${schema},public`,
        statement_timeout: 10_000
      },
      types: {
        timestamp: {
          to: 1184,
          from: [1184],
          serialize: (value: Date | string) =>
            value instanceof Date ? value.toISOString() : value,
          parse: (value: string) => new Date(value).toISOString()
        },
        date: {
          to: 1082,
          from: [1082],
          serialize: (value: string) => value,
          parse: (value: string) => value
        }
      }
    })
    const repository = new DailyReportRepository(() => sql)
    const second = new DailyReportRepository(() => sql)
    const fixture = JSON.parse(
      readFileSync(new URL('../../../shared/daily-report.fixture.json', import.meta.url), 'utf8')
    )
    const input: FrozenInput = {
      materials: fixture.sources.map((s: Record<string, unknown>) => ({
        ...s,
        text: 'Fixture material',
        isExcerpt: false
      })),
      prompt: 'fixture',
      userInput: 'fixture',
      hash: 'a'.repeat(64),
      promptVersion: 'fixture'
    }

    beforeAll(async () => {
      await admin.unsafe(`create schema ${schema}`)
      await admin.unsafe(
        `create table ${schema}.daily_report_jobs (like public.daily_report_jobs including all)`
      )
      await admin.unsafe(
        `create table ${schema}.daily_reports (like public.daily_reports including all)`
      )
    }, 30_000)
    afterAll(async () => {
      await sql.end({ timeout: 5 })
      if (!/^daily_test_[a-f0-9]{32}$/.test(schema)) throw new Error('Unsafe test schema')
      await admin.unsafe(`drop schema if exists ${schema} cascade`)
      await admin.end({ timeout: 5 })
      vi.restoreAllMocks()
    }, 30_000)

    it('deduplicates simultaneous submissions and lets only one runner claim a date', async () => {
      const jobs = await Promise.all(
        Array.from({ length: 12 }, () => repository.submit('2001-01-01'))
      )
      expect(new Set(jobs.map((job) => job?.id)).size).toBe(1)
      const claims = await Promise.all([repository.claim(), second.claim()])
      expect(claims.filter(Boolean)).toHaveLength(1)
      const job = claims.find(Boolean)
      if (!job) throw new Error('No claimed job')
      expect(job.report_date).toBe('2001-01-01')
      expect(job.attempt_count).toBe(1)
      await repository.freeze(job, input, new Date())
      await expect(repository.freeze(job, input, new Date())).rejects.toThrow('lease_lost')
      await sql`update daily_report_jobs set lease_until=now()-interval '1 second' where report_date=${job.report_date}`
      const takeover = await second.claim()
      if (!takeover) throw new Error('No takeover')
      expect(takeover.run_token).not.toBe(job.run_token)
      expect(takeover.input_snapshot).toEqual(input)
      expect(takeover.attempt_count).toBe(2)
      expect(await repository.heartbeat(job)).toBe(false)
      await expect(repository.publish(job, input, fixture.draft, {})).rejects.toThrow('lease_lost')
      await second.publish(takeover, input, fixture.draft, {
        model: 'test-fixture'
      })
      await expect(repository.publish(takeover, input, fixture.draft, {})).rejects.toThrow(
        'lease_lost'
      )
      expect((await repository.submit('2001-01-01', true))?.status).toBe('published')
      const [count] = await sql`select count(*)::int as count from daily_reports`
      expect(count?.count).toBe(1)
      const [report] = await sql`select sources,content from daily_reports`
      expect(report?.sources[0]).not.toHaveProperty('text')
      expect(report?.sources[0]).not.toHaveProperty('isExcerpt')
      expect(report?.content).toEqual(fixture.draft)
      const [published] = await sql`select metrics from daily_report_jobs`
      expect(published?.metrics).toEqual({ model: 'test-fixture' })
    }, 30_000)

    it('claims persisted notifications independently of inference, with bounded retries', async () => {
      const notice = await repository.claimNotification()
      if (!notice) throw new Error('No notification')
      expect(notice.notification_attempts).toBe(1)
      expect(await second.claimNotification()).toBeUndefined()
      await repository.finishNotification(notice, false)
      for (let attempt = 2; attempt <= 6; attempt++) {
        await sql`update daily_report_jobs set notification_next_at=now() where report_date=${notice.report_date}`
        const next = await second.claimNotification()
        if (!next) throw new Error('No retry notification')
        expect(next.notification_attempts).toBe(attempt)
        await second.finishNotification(next, false)
      }
      expect(await repository.claimNotification()).toBeUndefined()
      const [stored] =
        await sql`select status,notification_status,attempt_count from daily_report_jobs where report_date=${notice.report_date}`
      expect(stored).toMatchObject({
        status: 'published',
        notification_status: 'failed',
        attempt_count: 2
      })
    }, 30_000)

    it('caps automatic attempts and grants exactly one cumulative manual retry', async () => {
      await repository.submit('2001-01-02')
      for (let attempt = 1; attempt <= 3; attempt++) {
        const job = await repository.claim()
        if (!job) throw new Error('No retry job')
        expect(job.attempt_count).toBe(attempt)
        await repository.finish(job, 'failed', 'test_failure', true, { attempt })
        expect((await repository.status(job.report_date))?.status).toBe(
          attempt === 3 ? 'failed' : 'retry_wait'
        )
        await sql`update daily_report_jobs set next_attempt_at=now() where report_date=${job.report_date}`
      }
      const [failed] =
        await sql`select metrics from daily_report_jobs where report_date='2001-01-02'`
      expect(failed?.metrics).toEqual({ attempt: 3 })
      expect(await repository.claim()).toBeUndefined()
      await repository.submit('2001-01-02', true)
      const manual = await repository.claim()
      if (!manual) throw new Error('No manual retry')
      expect(manual.attempt_count).toBe(4)
      expect(manual.attempt_limit).toBe(4)
      await repository.finish(manual, 'failed', 'test_failure', true)
      expect((await repository.status(manual.report_date))?.status).toBe('failed')
      expect(await repository.claim()).toBeUndefined()
    }, 30_000)

    it('can retry no_material, but never reopens a valid no_news result', async () => {
      await repository.submit('2001-01-03')
      const empty = await repository.claim()
      if (!empty) throw new Error('No empty job')
      await repository.finish(empty, 'no_material')
      await repository.submit(empty.report_date, true)
      const retry = await repository.claim()
      if (!retry) throw new Error('No material retry')
      expect(retry.input_snapshot).toBeNull()
      await repository.finish(retry, 'no_news')
      expect((await repository.submit(retry.report_date, true))?.status).toBe('no_news')
      expect(await repository.claim()).toBeUndefined()
    }, 30_000)
  }
)
