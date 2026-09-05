create table public.signal_articles (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  source text not null,
  source_key text not null,
  title text not null,
  url text not null,
  image_url text,
  summary text,
  author text,
  published_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  is_pinned boolean not null default false,
  constraint signal_articles_source_key_unique unique (source, source_key),
  constraint signal_articles_source_section_check check (
    (section = 'technology' and source in ('github', 'hacker-news', 'juejin', 'v2ex', 'ithome', '36kr'))
    or
    (section = 'news' and source in ('xinhua', 'cctv', 'chinanews', 'thepaper', 'jiemian', 'baidu'))
    or
    (section = 'ai' and source in ('openai', 'anthropic', 'deepseek', 'glm', 'google-ai', 'qwen'))
    or
    (section = 'social' and source in ('bilibili', 'zhihu', 'coolapk', 'hupu', 'sspai', 'toutiao'))
    or
    (section = 'finance' and source in ('wallstreetcn', 'cls', 'jin10', 'yicai', 'stcn', '10jqka'))
    or
    (section = 'games' and source in ('3dmgame', 'gcores', 'gamersky', 'ali213', 'indienova', 'steam'))
  ),
  constraint signal_articles_title_check check (length(btrim(title)) > 0),
  constraint signal_articles_url_check check (url ~ '^https?://'),
  constraint signal_articles_image_url_check check (image_url is null or image_url ~ '^https?://'),
  constraint signal_articles_seen_at_check check (last_seen_at >= first_seen_at)
);

create index signal_articles_section_source_last_seen_idx
  on public.signal_articles (section, source, last_seen_at);
create index signal_articles_retention_idx
  on public.signal_articles (last_seen_at, is_pinned);

insert into public.signal_articles (
  section, source, source_key, title, url, image_url, summary, author, published_at,
  first_seen_at, last_seen_at
)
select
  section, source, source_key, title, url, image_url, summary, author, published_at,
  first_seen_at, last_seen_at
from public.hot_items
on conflict (source, source_key) do update set
  section = excluded.section,
  title = excluded.title,
  url = excluded.url,
  image_url = excluded.image_url,
  summary = excluded.summary,
  author = excluded.author,
  published_at = excluded.published_at,
  last_seen_at = excluded.last_seen_at;

alter table public.hot_items add column article_id uuid;

update public.hot_items as item
set article_id = article.id
from public.signal_articles as article
where article.source = item.source and article.source_key = item.source_key;

alter table public.hot_items
  alter column article_id set not null,
  add constraint hot_items_article_id_fkey
    foreign key (article_id) references public.signal_articles (id) on delete restrict;

create index hot_items_article_id_idx on public.hot_items (article_id);

create table public.ai_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  occurred_at timestamptz not null,
  status text not null default 'draft',
  first_published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_events_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint ai_events_title_check check (length(btrim(title)) > 0),
  constraint ai_events_summary_check check (length(btrim(summary)) > 0),
  constraint ai_events_status_check check (status in ('draft', 'published', 'archived')),
  constraint ai_events_published_at_check check (
    (status = 'draft' and first_published_at is null)
    or (status in ('published', 'archived') and first_published_at is not null)
  ),
  constraint ai_events_updated_at_check check (updated_at >= created_at)
);

create index ai_events_status_occurred_at_idx
  on public.ai_events (status, occurred_at desc);

create table public.ai_event_articles (
  event_id uuid not null references public.ai_events (id) on delete cascade,
  article_id uuid not null references public.signal_articles (id) on delete restrict,
  position integer not null default 1 check (position > 0),
  primary key (event_id, article_id),
  constraint ai_event_articles_event_position_unique unique (event_id, position)
);

create index ai_event_articles_article_id_idx
  on public.ai_event_articles (article_id);

alter table public.signal_articles enable row level security;
alter table public.ai_events enable row level security;
alter table public.ai_event_articles enable row level security;

grant select on table public.signal_articles to anon, authenticated;
grant select on table public.ai_events to anon, authenticated;
grant select on table public.ai_event_articles to anon, authenticated;
grant all on table public.signal_articles to service_role;
grant all on table public.ai_events to service_role;
grant all on table public.ai_event_articles to service_role;

create policy "Public can read published AI events"
  on public.ai_events
  for select
  to anon, authenticated
  using (status = 'published');

create policy "Public can read published AI event links"
  on public.ai_event_articles
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.ai_events as event
      where event.id = ai_event_articles.event_id and event.status = 'published'
    )
  );

create policy "Public can read articles linked to published AI events"
  on public.signal_articles
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.ai_event_articles as event_article
      join public.ai_events as event on event.id = event_article.event_id
      where event_article.article_id = signal_articles.id and event.status = 'published'
    )
  );
