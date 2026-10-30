-- AI Model Leaderboard Tables
create table public.ai_models (
  slug text primary key,
  name text not null,
  creator text not null,
  description text,
  official_url text,
  overall_score text,
  released_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index ai_models_last_seen_idx on public.ai_models (last_seen_at);
create index ai_models_creator_idx on public.ai_models (creator);
alter table public.ai_models enable row level security;
grant select on public.ai_models to anon, authenticated;
revoke insert, update, delete on public.ai_models from anon, authenticated;
create policy "Public can read AI models" on public.ai_models
  for select to anon, authenticated using (true);

create table public.ai_model_prices (
  id uuid primary key default gen_random_uuid(),
  model_slug text not null references public.ai_models (slug) on delete cascade,
  currency text not null default 'CNY',
  input_price_per_million text,
  output_price_per_million text,
  cached_input_price_per_million text,
  updated_at timestamptz not null default now()
);

create index ai_model_prices_model_slug_idx on public.ai_model_prices (model_slug);
alter table public.ai_model_prices enable row level security;
grant select on public.ai_model_prices to anon, authenticated;
revoke insert, update, delete on public.ai_model_prices from anon, authenticated;
create policy "Public can read AI model prices" on public.ai_model_prices
  for select to anon, authenticated using (true);

create table public.ai_leaderboard_ranks (
  id uuid primary key default gen_random_uuid(),
  model_slug text not null references public.ai_models (slug) on delete cascade,
  category text not null,
  rank integer not null,
  score text not null,
  percentile text,
  updated_at timestamptz not null default now(),
  constraint ai_leaderboard_ranks_category_slug_unique unique (category, model_slug)
);

create index ai_leaderboard_ranks_category_rank_idx on public.ai_leaderboard_ranks (category, rank);
alter table public.ai_leaderboard_ranks enable row level security;
grant select on public.ai_leaderboard_ranks to anon, authenticated;
revoke insert, update, delete on public.ai_leaderboard_ranks from anon, authenticated;
create policy "Public can read AI leaderboard ranks" on public.ai_leaderboard_ranks
  for select to anon, authenticated using (true);

create table public.ai_model_evidences (
  id uuid primary key default gen_random_uuid(),
  model_slug text not null references public.ai_models (slug) on delete cascade,
  source_key text not null,
  benchmark_name text not null,
  evaluator text not null,
  domain text not null,
  raw_score text,
  capability_score text,
  reasoning_tier text,
  measured boolean not null default true,
  source_url text,
  updated_at timestamptz not null default now()
);

create index ai_model_evidences_model_domain_idx on public.ai_model_evidences (model_slug, domain);
alter table public.ai_model_evidences enable row level security;
grant select on public.ai_model_evidences to anon, authenticated;
revoke insert, update, delete on public.ai_model_evidences from anon, authenticated;
create policy "Public can read AI model evidences" on public.ai_model_evidences
  for select to anon, authenticated using (true);
