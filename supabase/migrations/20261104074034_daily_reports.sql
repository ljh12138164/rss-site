-- Daily report jobs and validated public editions.
create table public.daily_report_jobs (
  report_date date primary key check (report_date >= date '2000-01-01'),
  id uuid not null unique default gen_random_uuid(),
  status text not null default 'queued' check (status in ('queued','running','retry_wait','published','failed','no_material','no_news')),
  trigger_kind text not null default 'manual' check (trigger_kind in ('auto','manual')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  attempt_limit integer not null default 3 check (attempt_limit >= attempt_count and attempt_limit > 0),
  next_attempt_at timestamptz not null default now(),
  run_token uuid,
  lease_until timestamptz,
  window_start timestamptz not null,
  window_end timestamptz not null,
  snapshot_at timestamptz,
  input_snapshot jsonb check (input_snapshot is null or (jsonb_typeof(input_snapshot)='object' and octet_length(input_snapshot::text)<=262144)),
  input_hash text check (input_hash is null or input_hash ~ '^[a-f0-9]{64}$'),
  prompt_snapshot text,
  selection_version text not null default 'bounded-v1',
  prompt_version text,
  schema_version integer not null default 1 check (schema_version=1),
  primary_model text not null default 'gemini-3.8-flash',
  fallback_model text not null default '@cf/openai/gpt-oss-120b',
  metrics jsonb check (metrics is null or octet_length(metrics::text)<=16384),
  last_error_code text,
  started_at timestamptz,
  finished_at timestamptz,
  notification_status text not null default 'none' check (notification_status in ('none','pending','accepted','failed')),
  notification_attempts integer not null default 0 check (notification_attempts between 0 and 6),
  notification_next_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status='running' and run_token is not null and lease_until is not null)
    or (status<>'running' and run_token is null and lease_until is null)),
  check (window_end = report_date::timestamp at time zone 'Asia/Shanghai'),
  check (window_start = window_end - interval '1 day'),
  check ((input_snapshot is null and input_hash is null and snapshot_at is null and prompt_snapshot is null)
    or (input_snapshot is not null and input_hash is not null and snapshot_at is not null and prompt_snapshot is not null)),
  check (notification_status='none' or status='published')
);

create index daily_report_jobs_ready_idx on public.daily_report_jobs (next_attempt_at, report_date)
  where status in ('queued','retry_wait','running');
create index daily_report_jobs_notification_idx on public.daily_report_jobs (notification_next_at)
  where status='published' and notification_status='pending';

create table public.daily_reports (
  report_date date primary key references public.daily_report_jobs(report_date),
  job_id uuid not null unique references public.daily_report_jobs(id),
  title text not null check (length(title) between 1 and 100),
  content jsonb not null check (jsonb_typeof(content)='object' and octet_length(content::text)<=65536),
  sources jsonb not null check (jsonb_typeof(sources)='array' and jsonb_array_length(sources) between 1 and 36 and octet_length(sources::text)<=131072),
  window_start timestamptz not null,
  window_end timestamptz not null,
  input_hash text not null check (input_hash ~ '^[a-f0-9]{64}$'),
  candidate_count integer not null check (candidate_count between 1 and 48),
  story_count integer not null check (story_count between 1 and 12),
  source_count integer not null check (source_count between 1 and 36),
  prompt_version text not null,
  schema_version integer not null default 1 check (schema_version=1),
  published_at timestamptz not null default now(),
  check (window_end = report_date::timestamp at time zone 'Asia/Shanghai'),
  check (window_start = window_end - interval '1 day'),
  check (content ? 'stories' and jsonb_typeof(content->'stories')='array' and jsonb_array_length(content->'stories')=story_count)
);

alter table public.daily_report_jobs enable row level security;
alter table public.daily_reports enable row level security;
revoke all on public.daily_report_jobs, public.daily_reports from public, anon, authenticated;
grant select on public.daily_reports to anon, authenticated;
grant select, insert, update, delete on public.daily_report_jobs to service_role;
grant select, insert on public.daily_reports to service_role;
create policy "Published daily reports are publicly readable" on public.daily_reports
  for select to anon, authenticated using (true);

comment on table public.daily_report_jobs is 'Private durable editorial jobs; prompts, evidence, leases and metrics are never public';
comment on table public.daily_reports is 'Validated immutable daily editions; citations are retained as snapshots without article foreign keys';
notify pgrst, 'reload schema';
