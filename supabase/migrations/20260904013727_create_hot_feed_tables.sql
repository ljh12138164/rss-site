create table public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source = 'juejin'),
  status text not null check (status in ('running', 'succeeded', 'failed')),
  item_count integer not null default 0 check (item_count >= 0),
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  constraint ingestion_runs_finished_state check (
    (status = 'running' and finished_at is null)
    or (status in ('succeeded', 'failed') and finished_at is not null)
  )
);

create table public.source_status (
  source text primary key check (source = 'juejin'),
  section text not null check (section = 'technology'),
  item_count integer not null check (item_count >= 0),
  last_success_at timestamptz not null,
  last_batch_id uuid not null references public.ingestion_runs(id) on delete restrict
);

create table public.hot_items (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section = 'technology'),
  source text not null check (source = 'juejin'),
  source_key text not null,
  title text not null check (length(btrim(title)) > 0),
  url text not null check (url ~ '^https://juejin\.cn/'),
  summary text,
  author text,
  published_at timestamptz,
  position integer not null check (position > 0),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  batch_id uuid not null references public.ingestion_runs(id) on delete restrict,
  constraint hot_items_source_key_unique unique (source, source_key)
);

create index hot_items_section_source_position_idx
  on public.hot_items (section, source, position);

create index ingestion_runs_source_started_at_idx
  on public.ingestion_runs (source, started_at desc);

alter table public.hot_items enable row level security;
alter table public.source_status enable row level security;
alter table public.ingestion_runs enable row level security;

revoke all on table public.hot_items from anon, authenticated;
revoke all on table public.source_status from anon, authenticated;
revoke all on table public.ingestion_runs from anon, authenticated;

grant select on table public.hot_items to anon, authenticated;
grant select on table public.source_status to anon, authenticated;

create policy "Public can read hot items"
  on public.hot_items
  for select
  to anon, authenticated
  using (true);

create policy "Public can read source status"
  on public.source_status
  for select
  to anon, authenticated
  using (true);
