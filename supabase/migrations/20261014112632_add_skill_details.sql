create table public.skill_details (
  skill_id text primary key,
  name text not null,
  source text not null,
  source_type text not null check (source_type in ('github', 'well-known')),
  upstream_url text not null,
  install_url text,
  description text,
  skill_markdown text,
  content_html text,
  total_installs integer check (total_installs >= 0),
  content_hash text,
  detail_state text not null check (detail_state in ('ready', 'missing', 'error', 'oversize')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  content_synced_at timestamptz,
  total_installs_synced_at timestamptz
);
create index skill_details_source_idx on public.skill_details (source);
alter table public.skill_details enable row level security;
grant select on public.skill_details to anon, authenticated;
revoke insert, update, delete on public.skill_details from anon, authenticated;
create policy "Public can read collected Skills" on public.skill_details
  for select to anon, authenticated using (true);
