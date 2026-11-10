-- Private analysis cache and one atomically published homepage ranking.
create table if not exists public.hot_ranking_analysis (
  article_id uuid primary key references public.signal_articles(id) on delete cascade,
  input_hash text not null check (input_hash ~ '^[a-f0-9]{64}$'),
  event_id uuid,
  title text not null,
  summary text not null,
  updated_at timestamptz not null default now(),
  check ((event_id is null and title='' and summary='') or
    (event_id is not null and length(title) between 1 and 100 and length(summary) between 1 and 180))
);
create table if not exists public.hot_ranking_state (
  singleton boolean primary key default true check (singleton),
  lease_token uuid,
  lease_until timestamptz,
  attempted_at timestamptz,
  computed_at timestamptz,
  snapshot jsonb,
  last_error text,
  check ((lease_token is null) = (lease_until is null))
);
insert into public.hot_ranking_state(singleton) values(true) on conflict do nothing;
alter table public.hot_ranking_analysis enable row level security;
alter table public.hot_ranking_state enable row level security;
revoke all on public.hot_ranking_analysis,public.hot_ranking_state from public;
grant select,insert,update,delete on public.hot_ranking_analysis,public.hot_ranking_state to rss_site_app;
drop policy if exists hot_analysis_app on public.hot_ranking_analysis;
create policy hot_analysis_app on public.hot_ranking_analysis to rss_site_app using(true) with check(true);
drop policy if exists hot_state_app on public.hot_ranking_state;
create policy hot_state_app on public.hot_ranking_state to rss_site_app using(true) with check(true);
