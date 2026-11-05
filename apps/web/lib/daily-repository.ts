import { randomUUID } from 'node:crypto'
import { listSignalSources } from '@rss-site/signals'
import { type DailyDraft, type DailySource, reportWindow } from '../../../shared/daily-report'
import type { Candidate, FrozenInput, PreviousStory } from '../../../shared/daily-repository'
import { getBusinessDatabase } from './business-db'

const DAILY_SOURCES = listSignalSources({ isArticle: true })

export type JobStatus =
  | 'queued'
  | 'running'
  | 'retry_wait'
  | 'published'
  | 'failed'
  | 'no_material'
  | 'no_news'
export type DailyJob = {
  id: string
  report_date: string
  status: JobStatus
  attempt_count: number
  attempt_limit: number
  run_token: string
  input_snapshot: FrozenInput | null
  snapshot_at: Date | null
  notification_attempts: number
}

type JobHandle = Pick<DailyJob, 'id' | 'report_date' | 'run_token' | 'notification_attempts'>

export class DailyReportRepository {
  constructor(private readonly database = () => getBusinessDatabase().client) {}
  private sql() {
    return this.database()
  }

  async submit(date: string, retry = false, trigger: 'auto' | 'manual' = 'manual') {
    const sql = this.sql()
    const { windowStart, windowEnd } = reportWindow(date)
    await sql`insert into daily_report_jobs (report_date, window_start, window_end, trigger_kind)
      values (${date}, ${windowStart}, ${windowEnd}, ${trigger}) on conflict (report_date) do nothing`
    if (retry)
      await sql`update daily_report_jobs set status='queued', next_attempt_at=now(),
      attempt_limit=attempt_count+1, trigger_kind='manual', updated_at=now(), finished_at=null
      where report_date=${date} and status in ('failed','no_material')`
    return this.status(date)
  }

  async status(date: string) {
    const [job] = await this.sql()<DailyJob[]>`select id, report_date, status, attempt_count,
      attempt_limit, last_error_code, finished_at, notification_status from daily_report_jobs where report_date=${date}`
    return job
  }

  async claim(): Promise<DailyJob | undefined> {
    const sql = this.sql()
    await sql`update daily_report_jobs set status='failed', finished_at=now(), updated_at=now(),
      last_error_code='lease_exhausted', run_token=null, lease_until=null
      where status='running' and lease_until<now() and attempt_count>=attempt_limit`
    const [job] = await sql<DailyJob[]>`with candidate as (
      select report_date from daily_report_jobs where attempt_count<attempt_limit and
      ((status in ('queued','retry_wait') and next_attempt_at<=now()) or (status='running' and lease_until<now()))
      order by next_attempt_at, report_date for update skip locked limit 1
    ) update daily_report_jobs j set status='running', attempt_count=attempt_count+1,
      run_token=${randomUUID()}, lease_until=now()+interval '5 minutes', started_at=now(), updated_at=now()
      from candidate c where j.report_date=c.report_date returning j.*`
    return job
  }

  async heartbeat(job: JobHandle) {
    const rows =
      await this.sql()`update daily_report_jobs set lease_until=now()+interval '5 minutes', updated_at=now()
      where report_date=${job.report_date} and run_token=${job.run_token} and status='running' and lease_until>now() returning id`
    return rows.length === 1
  }

  async candidates(job: JobHandle, snapshotAt: Date): Promise<Candidate[]> {
    const sql = this.sql()
    const { windowStart, windowEnd } = reportWindow(job.report_date)
    // Bound rows before transferring HTML. SQL and application both enforce text eligibility.
    return sql<Candidate[]>`with eligible as (
      select *, coalesce(published_at,first_seen_at) as effective_at,
        row_number() over(partition by source order by coalesce(published_at,first_seen_at) desc,id) as source_rank
      from signal_articles where source=any(${DAILY_SOURCES.map((s) => s.id)}) and is_indexable=true
      and section in ('ai','technology','news','social','finance','games')
      and coalesce(published_at,first_seen_at)>=${windowStart} and coalesce(published_at,first_seen_at)<${windowEnd}
      and first_seen_at<=${snapshotAt.toISOString()} and length(coalesce(nullif(content_html,''),summary,''))>=40
      and octet_length(coalesce(nullif(content_html,''),summary,''))<=524288
    ), ranked as (
      select *, row_number() over(partition by section order by effective_at desc,source,id) as section_rank
      from eligible where source_rank<=4
    ) select id,section,source,title,url,image_url,summary,content_html,published_at,first_seen_at
      from ranked where section_rank<=8 order by case when section='ai' then 0 when section='technology' then 1 else 2 end,
      effective_at desc,source,id limit 48`
  }

  async history(date: string): Promise<PreviousStory[]> {
    const reports =
      await this.sql()`select report_date,content->'stories' as stories from daily_reports
      where report_date<${date} and report_date>=${date}::date-7 order by report_date desc limit 7`
    return reports.flatMap((row) =>
      (row.stories as DailyDraft['stories']).map((story) => ({
        reportDate: row.report_date as string,
        title: story.title,
        summary: story.summary
      }))
    )
  }

  async freeze(job: JobHandle, input: FrozenInput, snapshotAt: Date) {
    const sql = this.sql()
    const rows =
      await sql`update daily_report_jobs set input_snapshot=${JSON.stringify(input)}::jsonb, input_hash=${input.hash},
      prompt_snapshot=${input.prompt}, prompt_version=${input.promptVersion}, snapshot_at=${snapshotAt.toISOString()}, updated_at=now()
      where report_date=${job.report_date} and run_token=${job.run_token} and status='running' and lease_until>now()
      and input_snapshot is null returning id`
    if (!rows.length) throw new Error('lease_lost')
  }

  async finish(
    job: JobHandle,
    status: 'no_material' | 'no_news' | 'failed',
    code: string | null = null,
    retry = false,
    metrics?: Record<string, unknown>
  ) {
    const sql = this.sql()
    await sql`update daily_report_jobs set
      status=case when ${retry} and attempt_count<attempt_limit then 'retry_wait' else ${status} end,
      next_attempt_at=now()+case when attempt_count=1 then interval '2 minutes' else interval '10 minutes' end,
      last_error_code=${code}, metrics=coalesce(${metrics ? JSON.stringify(metrics) : null}::jsonb,metrics),
      run_token=null, lease_until=null, finished_at=now(), updated_at=now()
      where report_date=${job.report_date} and run_token=${job.run_token} and status='running' and lease_until>now()`
  }

  async release(job: JobHandle) {
    await this.sql()`update daily_report_jobs set lease_until=now()-interval '1 second', updated_at=now()
      where report_date=${job.report_date} and run_token=${job.run_token} and status='running'`
  }

  async publish(
    job: JobHandle,
    input: FrozenInput,
    draft: DailyDraft,
    metrics: Record<string, unknown>
  ) {
    const firstStory = draft.stories[0]
    if (!firstStory) throw new Error('invalid_daily_draft')
    const sql = this.sql()
    const selected = new Set(draft.stories.flatMap((story) => story.sourceIds))
    const sources: DailySource[] = input.materials
      .filter((item) => selected.has(item.id))
      .map(({ text: _text, isExcerpt: _isExcerpt, ...source }) => source)
    await sql.begin(async (tx) => {
      const rows = await tx`select id from daily_report_jobs where report_date=${job.report_date}
        and run_token=${job.run_token} and status='running' and lease_until>now() for update`
      if (!rows.length) throw new Error('lease_lost')
      const { windowStart, windowEnd } = reportWindow(job.report_date)
      await tx`insert into daily_reports (report_date,job_id,title,content,sources,window_start,window_end,
        input_hash,candidate_count,story_count,source_count,prompt_version)
        values (${job.report_date},${job.id},${firstStory.title},${JSON.stringify(draft)}::jsonb,${JSON.stringify(sources)}::jsonb,
        ${windowStart},${windowEnd},${input.hash},${input.materials.length},${draft.stories.length},
        ${new Set(sources.map((source) => source.source)).size},${input.promptVersion})`
      await tx`update daily_report_jobs set status='published',run_token=null,lease_until=null,finished_at=now(),
        updated_at=now(),metrics=${JSON.stringify(metrics)}::jsonb,last_error_code=null,
        notification_status='pending',notification_next_at=now() where report_date=${job.report_date}`
    })
  }

  async claimNotification() {
    const sql = this.sql()
    await sql`update daily_report_jobs set notification_status='failed' where notification_status='pending'
      and notification_attempts>=6 and notification_next_at<=now()`
    const [job] = await sql<DailyJob[]>`with candidate as (
      select report_date from daily_report_jobs where status='published' and notification_status='pending'
        and notification_attempts<6 and notification_next_at<=now() order by notification_next_at for update skip locked limit 1
    ) update daily_report_jobs j set notification_attempts=notification_attempts+1,
      notification_next_at=now()+interval '1 minute',updated_at=now() from candidate c
      where j.report_date=c.report_date returning j.*`
    return job
  }

  async finishNotification(job: JobHandle, ok: boolean) {
    const delay = [60, 300, 1800, 7200, 21600][job.notification_attempts - 1] ?? 21600
    await this.sql()`update daily_report_jobs set notification_status=${ok ? 'accepted' : job.notification_attempts >= 6 ? 'failed' : 'pending'},
      notification_next_at=now()+${delay}*interval '1 second',updated_at=now()
      where report_date=${job.report_date} and notification_attempts=${job.notification_attempts} and notification_status='pending'`
  }
}
