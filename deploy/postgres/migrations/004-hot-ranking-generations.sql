-- Model replies are internal diagnostics, separate from published ranking data.
create table if not exists private.hot_ranking_generations (
  batch_id uuid not null,
  phase text not null check (phase in ('analysis', 'review')),
  article_ids uuid[] not null check (cardinality(article_ids) between 1 and 6),
  model text not null check (length(model) between 1 and 100),
  started_at timestamptz not null,
  elapsed_ms integer not null check (elapsed_ms >= 0),
  status text not null check (status in ('ok', 'recovered', 'failed')),
  issue_code text check (issue_code ~ '^[a-z][a-z0-9_]{0,79}$'),
  result text check (octet_length(result) <= 32768),
  result_truncated boolean not null,
  recorded_at timestamptz not null default now(),
  primary key (batch_id, phase),
  check ((status = 'ok') = (issue_code is null)),
  check (status = 'failed' or result is not null),
  check (not result_truncated or result is not null)
);
create index if not exists hot_ranking_generations_recorded_idx
  on private.hot_ranking_generations (recorded_at);

alter table private.hot_ranking_generations enable row level security;
revoke all on private.hot_ranking_generations from public, rss_site_app;
grant usage on schema private to rss_site_app;
grant insert, delete on private.hot_ranking_generations to rss_site_app;
grant select (recorded_at) on private.hot_ranking_generations to rss_site_app;
drop policy if exists hot_generations_insert on private.hot_ranking_generations;
create policy hot_generations_insert on private.hot_ranking_generations
  for insert to rss_site_app with check (true);
drop policy if exists hot_generations_retention on private.hot_ranking_generations;
create policy hot_generations_retention on private.hot_ranking_generations
  for delete to rss_site_app using (recorded_at < now() - interval '24 hours');
drop policy if exists hot_generations_retention_read on private.hot_ranking_generations;
create policy hot_generations_retention_read on private.hot_ranking_generations
  for select to rss_site_app using (recorded_at < now() - interval '24 hours');
