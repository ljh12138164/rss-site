import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import postgres from 'postgres'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { HotBatch } from '../../../shared/hot-ranking'

const state = vi.hoisted(() => ({ client: null as unknown }))
vi.mock('./business-db', () => ({ getBusinessDatabase: () => ({ client: state.client }) }))

import { getHotRanking, refreshHotRanking } from './hot-ranking'

describe.skipIf(!process.env.DAILY_REPORT_TEST_DATABASE_URL)(
  'hot ranking using PostgreSQL and a restricted application role',
  () => {
    const schema = `hot_${randomUUID().replaceAll('-', '')}`
    const role = `hot_app_${randomUUID().replaceAll('-', '')}`
    const admin = postgres(process.env.DAILY_REPORT_TEST_DATABASE_URL ?? '', { max: 2 })
    let app: ReturnType<typeof postgres>
    const analyze = vi.fn(async (input: HotBatch) =>
      input.articles.map((a) => ({
        id: a.id,
        eventId: input.articles[0].id,
        title: '公司正式发布了新版本',
        summary: '目前仅对获准测试用户开放，原有版本保持可用。'
      }))
    )
    beforeAll(async () => {
      await admin.unsafe(`create role ${role} login password 'hot-ci-only'; create schema ${schema}; grant usage on schema ${schema} to ${role};
   create table ${schema}.signal_articles (id uuid primary key,source text,section text,title text,url text,image_url text,content_html text,summary text,published_at timestamptz,first_seen_at timestamptz,content_updated_at timestamptz,is_indexable boolean);
   create table ${schema}.source_status(source text,last_success_at timestamptz);grant select on all tables in schema ${schema} to ${role};`)
      const migration = readFileSync(
        new URL('../../../deploy/postgres/migrations/003-home-hot-ranking.sql', import.meta.url),
        'utf8'
      )
        .replaceAll('public.', `${schema}.`)
        .replaceAll('rss_site_app', role)
      await admin.unsafe(migration)
      const url = new URL(process.env.DAILY_REPORT_TEST_DATABASE_URL ?? '')
      url.username = role
      url.password = 'hot-ci-only'
      app = postgres(url.href, {
        max: 4,
        connection: { search_path: schema },
        types: {
          timestamp: {
            to: 1184,
            from: [1184],
            serialize: (v: Date | string) => (v instanceof Date ? v.toISOString() : v),
            parse: (v: string) => new Date(v).toISOString()
          }
        }
      })
      state.client = app
    }, 30000)
    beforeEach(async () => {
      analyze.mockClear()
      await admin.unsafe(
        `truncate ${schema}.hot_ranking_analysis,${schema}.signal_articles,${schema}.source_status;update ${schema}.hot_ranking_state set lease_token=null,lease_until=null,attempted_at=null,computed_at=null,snapshot=null,last_error=null;`
      )
      await admin.unsafe(`insert into ${schema}.source_status values('ithome',now());`)
      for (let i = 1; i <= 3; i++)
        await admin.unsafe(
          `insert into ${schema}.signal_articles values($1,$2,'technology',$3,$4,null,$5,null,now()-interval '1 hour',now()-interval '1 hour',now(),true)`,
          [
            `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
            i === 1 ? 'ithome' : '36kr',
            `公司发布模型版本2 ${i}`,
            `https://example.com/${i}`,
            `<p>${'完整报道说明了产品阶段以及限制条件。'.repeat(10)}</p>`
          ]
        )
    })
    afterAll(async () => {
      await app?.end()
      await admin.unsafe(`drop schema if exists ${schema} cascade;drop role if exists ${role};`)
      await admin.end()
    }, 30000)
    it('publishes once under concurrent claims, caches analysis and can be read by the app role', async () => {
      await Promise.all([refreshHotRanking(analyze), refreshHotRanking(analyze)])
      expect(analyze).toHaveBeenCalledTimes(1)
      const ranking = await getHotRanking()
      expect(ranking.state).toBe('ready')
      if (ranking.state === 'ready') {
        expect(ranking.entries[0].participants).toBe(2)
        expect(ranking.entries[0].references[0].available).toBe(true)
      }
      await admin.unsafe(
        `update ${schema}.hot_ranking_state set attempted_at=now()-interval '20 minutes'`
      )
      await refreshHotRanking(analyze)
      expect(analyze).toHaveBeenCalledTimes(1)
    })
    it('keeps the old complete snapshot on model failure and reports delay', async () => {
      await refreshHotRanking(analyze)
      const before = await app`select snapshot from hot_ranking_state`
      await admin.unsafe(
        `update ${schema}.hot_ranking_state set attempted_at=now()-interval '20 minutes';update ${schema}.signal_articles set content_updated_at=now()+interval '1 second'`
      )
      await expect(
        refreshHotRanking(async () => {
          throw Error('synthetic failure')
        })
      ).rejects.toThrow()
      expect((await app`select snapshot from hot_ranking_state`)[0].snapshot).toEqual(
        before[0].snapshot
      )
      expect(await getHotRanking()).toMatchObject({ state: 'ready', delayed: true })
    })
    it('refuses stale lease writes and does not clear the new owner', async () => {
      const newer = randomUUID()
      await expect(
        refreshHotRanking(async (input) => {
          await admin.unsafe(
            `update ${schema}.hot_ranking_state set lease_token=$1,lease_until=now()+interval '5 minutes'`,
            [newer]
          )
          return analyze(input)
        })
      ).rejects.toThrow()
      const [row] = await app`select snapshot,lease_token from hot_ranking_state`
      expect(row.snapshot).toBeNull()
      expect(row.lease_token).toBe(newer)
    })
    it('distinguishes unavailable, successful empty, missing source data and damaged snapshots', async () => {
      expect(await getHotRanking()).toEqual({ state: 'unavailable' })
      await admin.unsafe(`delete from ${schema}.signal_articles`)
      await refreshHotRanking(analyze)
      expect(await getHotRanking()).toMatchObject({ state: 'ready', entries: [] })
      await admin.unsafe(
        `update ${schema}.hot_ranking_state set attempted_at=now()-interval '20 minutes';delete from ${schema}.source_status`
      )
      await expect(refreshHotRanking(analyze)).rejects.toThrow()
      await admin.unsafe(
        `update ${schema}.hot_ranking_state set snapshot='{"computedAt":"bad","entries":[]}'::jsonb`
      )
      expect(await getHotRanking()).toEqual({ state: 'unavailable' })
    })
    it('does not publish a ranking from a truncated candidate window', async () => {
      await admin.unsafe(`insert into ${schema}.signal_articles(id,source,section,title,url,content_html,published_at,first_seen_at,content_updated_at,is_indexable)
        select md5(i::text)::uuid,'ithome','technology','资料'||i,'https://example.com/'||i,repeat('完整事实',30),now()-interval '2 hours',now()-interval '2 hours',now(),true from generate_series(1,4001)i`)
      await expect(refreshHotRanking(analyze)).rejects.toThrow('coverage_limit')
      expect(analyze).not.toHaveBeenCalled()
      expect((await app`select snapshot from hot_ranking_state`)[0].snapshot).toBeNull()
    })
    it('resumes committed batches after failure while preserving the complete old snapshot', async () => {
      await refreshHotRanking(analyze)
      const old = (await app`select snapshot from hot_ranking_state`)[0].snapshot
      await admin.unsafe(`update ${schema}.signal_articles set content_updated_at=now()+interval '1 second';
        update ${schema}.hot_ranking_state set attempted_at=now()-interval '20 minutes';
        insert into ${schema}.signal_articles(id,source,section,title,url,content_html,published_at,first_seen_at,content_updated_at,is_indexable)
        select md5(i::text)::uuid,'ithome','technology','资料'||i,'https://example.com/'||i,repeat('完整事实',30),now()-interval '2 hours',now()-interval '2 hours',now(),true from generate_series(11,20)i`)
      let calls = 0
      await expect(
        refreshHotRanking(async (input) => {
          if (++calls === 2) throw Error('interrupted batch')
          return analyze(input)
        })
      ).rejects.toThrow()
      expect((await app`select snapshot from hot_ranking_state`)[0].snapshot).toEqual(old)
      expect(
        (await app`select count(*)::int as n from hot_ranking_analysis`)[0].n
      ).toBeGreaterThanOrEqual(6)
      await admin.unsafe(
        `update ${schema}.hot_ranking_state set attempted_at=now()-interval '20 minutes'`
      )
      const resumed: number[] = []
      await refreshHotRanking(async (input) => {
        resumed.push(input.articles.length)
        return analyze(input)
      })
      expect(resumed.reduce((a, b) => a + b, 0)).toBe(7)
      expect(await getHotRanking()).toMatchObject({ state: 'ready', delayed: false })
    })
  }
)
