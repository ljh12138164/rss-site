begin;
select plan(56);

select has_table('public', 'hot_items', 'hot_items exists');
select has_table('public', 'source_status', 'source_status exists');
select has_table('public', 'ingestion_runs', 'ingestion_runs exists');
select has_table('public', 'signal_articles', 'signal_articles exists');
select has_table('public', 'ai_events', 'ai_events exists');
select has_table('public', 'ai_event_articles', 'ai_event_articles exists');

select results_eq(
  $$select relrowsecurity from pg_class where oid = 'public.hot_items'::regclass$$,
  array[true],
  'hot_items has RLS enabled'
);
select results_eq(
  $$select relrowsecurity from pg_class where oid = 'public.source_status'::regclass$$,
  array[true],
  'source_status has RLS enabled'
);
select results_eq(
  $$select relrowsecurity from pg_class where oid = 'public.ingestion_runs'::regclass$$,
  array[true],
  'ingestion_runs has RLS enabled'
);
select results_eq(
  $$select relrowsecurity from pg_class where oid = 'public.signal_articles'::regclass$$,
  array[true],
  'signal_articles has RLS enabled'
);
select results_eq(
  $$select relrowsecurity from pg_class where oid = 'public.ai_events'::regclass$$,
  array[true],
  'ai_events has RLS enabled'
);
select results_eq(
  $$select relrowsecurity from pg_class where oid = 'public.ai_event_articles'::regclass$$,
  array[true],
  'ai_event_articles has RLS enabled'
);
select results_eq(
  $$select count(*)
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name in ('signal_articles', 'ai_events', 'ai_event_articles')
      and grantee in ('anon', 'authenticated')
      and privilege_type <> 'SELECT'$$,
  array[0::bigint],
  'public roles have no write or truncate privileges on persistent tables'
);
select results_eq(
  $$select count(*)
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name in ('signal_articles', 'ai_events', 'ai_event_articles')
      and grantee in ('anon', 'authenticated')
      and privilege_type = 'SELECT'$$,
  array[6::bigint],
  'public roles have select-only grants on persistent tables'
);

set local role anon;
select lives_ok($$select * from public.hot_items$$, 'anon reads hot items');
select lives_ok($$select * from public.source_status$$, 'anon reads source status');
select lives_ok($$select * from public.signal_articles$$, 'anon reads public signal articles');
select lives_ok($$select * from public.ai_events$$, 'anon reads published AI events');
select lives_ok(
  $$select * from public.ai_event_articles$$,
  'anon reads published AI event article links'
);
select throws_ok(
  $$insert into public.hot_items
    (section, source, source_key, title, url, position, batch_id)
    values
    ('technology', 'juejin', 'blocked', 'blocked', 'https://juejin.cn/post/blocked', 1, gen_random_uuid())$$,
  '42501',
  null,
  'anon cannot create hot items'
);
select throws_ok(
  $$select * from public.ingestion_runs$$,
  '42501',
  null,
  'anon cannot read ingestion runs'
);
select throws_ok(
  $$insert into public.ai_events (slug, title, summary, occurred_at)
    values ('blocked-event', 'blocked', 'blocked', now())$$,
  '42501',
  null,
  'anon cannot create AI events'
);

set local role authenticated;
select lives_ok($$select * from public.hot_items$$, 'authenticated reads hot items');
select lives_ok($$select * from public.source_status$$, 'authenticated reads source status');
select throws_ok(
  $$delete from public.hot_items$$,
  '42501',
  null,
  'authenticated cannot delete hot items'
);
select throws_ok(
  $$select * from public.ingestion_runs$$,
  '42501',
  null,
  'authenticated cannot read ingestion runs'
);

reset role;
select lives_ok(
  $$insert into public.signal_articles
    (id, section, source, source_key, title, url, image_url, published_at)
    values
    ('00000000-0000-0000-0000-000000000101', 'technology', 'github', 'external-story',
     'external story', 'https://example.com/story', null, now()),
    ('00000000-0000-0000-0000-000000000102', 'news', 'xinhua', 'xinhua-story',
     'xinhua story', 'https://www.news.cn/story', null, now()),
    ('00000000-0000-0000-0000-000000000103', 'ai', 'openai', 'openai-story',
     'openai story', 'https://openai.com/index/story', null, now()),
    ('00000000-0000-0000-0000-000000000104', 'social', 'bilibili', 'bilibili-video',
     'bilibili video', 'https://www.bilibili.com/video/BV123',
     'https://i2.hdslb.com/bfs/archive/cover.jpg', now()),
    ('00000000-0000-0000-0000-000000000105', 'finance', 'wallstreetcn', 'finance-story',
     'finance story', 'https://wallstreetcn.com/articles/1', null, now()),
    ('00000000-0000-0000-0000-000000000106', 'games', 'gcores', 'gcores-game',
     'gcores game', 'https://www.gcores.com/articles/1', null, now())$$,
  'confirmed sources can create persistent signal articles'
);
select throws_ok(
  $$insert into public.signal_articles
    (section, source, source_key, title, url)
    values ('news', 'gcores', 'wrong-game-article', 'wrong game article',
            'https://www.gcores.com/articles/2')$$,
  '23514',
  null,
  'persistent articles reject a mismatched source and section'
);
select lives_ok(
  $$insert into public.ingestion_runs
    (id, source, status, item_count, started_at, finished_at)
    values
    ('00000000-0000-0000-0000-000000000001', 'github', 'succeeded', 1, now(), now())$$,
  'a confirmed technology source can create an ingestion run'
);
select lives_ok(
  $$insert into public.hot_items
    (section, source, source_key, article_id, title, url, position, batch_id)
    values
    ('technology', 'github', 'external-story',
     '00000000-0000-0000-0000-000000000101', 'external story', 'https://example.com/story', 1,
     '00000000-0000-0000-0000-000000000001')$$,
  'technology items can link to an external web host'
);
select lives_ok(
  $$insert into public.ingestion_runs
    (id, source, status, item_count, started_at, finished_at)
    values
    ('00000000-0000-0000-0000-000000000002', 'xinhua', 'succeeded', 1, now(), now())$$,
  'a confirmed news source can create an ingestion run'
);
select lives_ok(
  $$insert into public.hot_items
    (section, source, source_key, article_id, title, url, position, batch_id)
    values
    ('news', 'xinhua', 'xinhua-story',
     '00000000-0000-0000-0000-000000000102', 'xinhua story', 'https://www.news.cn/story', 1,
     '00000000-0000-0000-0000-000000000002')$$,
  'news items accept the matching source and section'
);
select lives_ok(
  $$insert into public.ingestion_runs
    (id, source, status, item_count, started_at, finished_at)
    values
    ('00000000-0000-0000-0000-000000000003', 'openai', 'succeeded', 1, now(), now())$$,
  'a confirmed AI source can create an ingestion run'
);
select lives_ok(
  $$insert into public.hot_items
    (section, source, source_key, article_id, title, url, position, batch_id)
    values
    ('ai', 'openai', 'openai-story',
     '00000000-0000-0000-0000-000000000103', 'openai story', 'https://openai.com/index/story', 1,
     '00000000-0000-0000-0000-000000000003')$$,
  'AI items accept the matching source and section'
);
select lives_ok(
  $$insert into public.ingestion_runs
    (id, source, status, item_count, started_at, finished_at)
    values
    ('00000000-0000-0000-0000-000000000004', 'bilibili', 'succeeded', 1, now(), now())$$,
  'a confirmed social source can create an ingestion run'
);
select lives_ok(
  $$insert into public.hot_items
    (section, source, source_key, article_id, title, url, image_url, position, batch_id)
    values
    ('social', 'bilibili', 'bilibili-video',
     '00000000-0000-0000-0000-000000000104', 'bilibili video',
     'https://www.bilibili.com/video/BV123', 'https://i2.hdslb.com/bfs/archive/cover.jpg', 1,
     '00000000-0000-0000-0000-000000000004')$$,
  'social items accept a web preview image'
);
select throws_ok(
  $$insert into public.hot_items
    (section, source, source_key, article_id, title, url, position, batch_id)
    values
    ('news', 'bilibili', 'wrong-social-section',
     '00000000-0000-0000-0000-000000000104', 'wrong social section',
     'https://www.bilibili.com/video/BV456', 2,
     '00000000-0000-0000-0000-000000000004')$$,
  '23514',
  null,
  'social sources cannot be stored in the news section'
);
select lives_ok(
  $$insert into public.ingestion_runs
    (id, source, status, item_count, started_at, finished_at)
    values
    ('00000000-0000-0000-0000-000000000005', 'wallstreetcn', 'succeeded', 1, now(), now())$$,
  'a confirmed finance source can create an ingestion run'
);
select lives_ok(
  $$insert into public.hot_items
    (section, source, source_key, article_id, title, url, position, published_at, batch_id)
    values
    ('finance', 'wallstreetcn', 'finance-story',
     '00000000-0000-0000-0000-000000000105', 'finance story',
     'https://wallstreetcn.com/articles/1', 1, now(),
     '00000000-0000-0000-0000-000000000005')$$,
  'finance items accept the matching source and section'
);
select throws_ok(
  $$insert into public.hot_items
    (section, source, source_key, article_id, title, url, position, batch_id)
    values
    ('news', 'wallstreetcn', 'wrong-finance-section',
     '00000000-0000-0000-0000-000000000105', 'wrong finance section',
     'https://wallstreetcn.com/articles/2', 2,
     '00000000-0000-0000-0000-000000000005')$$,
  '23514',
  null,
  'finance sources cannot be stored in the news section'
);
select lives_ok(
  $$insert into public.ingestion_runs
    (id, source, status, item_count, started_at, finished_at)
    values
    ('00000000-0000-0000-0000-000000000006', 'gcores', 'succeeded', 1, now(), now())$$,
  'a confirmed game source can create an ingestion run'
);
select lives_ok(
  $$insert into public.hot_items
    (section, source, source_key, article_id, title, url, position, batch_id)
    values
    ('games', 'gcores', 'gcores-game',
     '00000000-0000-0000-0000-000000000106', 'gcores game',
     'https://www.gcores.com/articles/1', 1,
     '00000000-0000-0000-0000-000000000006')$$,
  'game articles accept a publication time'
);
select throws_ok(
  $$insert into public.hot_items
    (section, source, source_key, article_id, title, url, position, batch_id)
    values
    ('news', 'gcores', 'wrong-game-section',
     '00000000-0000-0000-0000-000000000106', 'wrong game section',
     'https://www.gcores.com/articles/2', 2,
     '00000000-0000-0000-0000-000000000006')$$,
  '23514',
  null,
  'game sources cannot be stored in the news section'
);
select throws_ok(
  $$insert into public.hot_items
    (section, source, source_key, article_id, title, url, image_url, position, batch_id)
    values
    ('social', 'bilibili', 'unsafe-image',
     '00000000-0000-0000-0000-000000000104', 'unsafe image',
     'https://www.bilibili.com/video/BV789', 'javascript:alert(1)', 3,
     '00000000-0000-0000-0000-000000000004')$$,
  '23514',
  null,
  'non-web preview image URLs are rejected'
);
select throws_ok(
  $$insert into public.hot_items
    (section, source, source_key, article_id, title, url, position, batch_id)
    values
    ('news', 'openai', 'wrong-ai-section',
     '00000000-0000-0000-0000-000000000103', 'wrong AI section',
     'https://openai.com/index/wrong', 2,
     '00000000-0000-0000-0000-000000000003')$$,
  '23514',
  null,
  'AI sources cannot be stored in the news section'
);
select throws_ok(
  $$insert into public.hot_items
    (section, source, source_key, article_id, title, url, position, batch_id)
    values
    ('technology', 'xinhua', 'wrong-section',
     '00000000-0000-0000-0000-000000000102', 'wrong section', 'https://www.news.cn/wrong', 2,
     '00000000-0000-0000-0000-000000000002')$$,
  '23514',
  null,
  'news sources cannot be stored in the technology section'
);
select throws_ok(
  $$insert into public.ingestion_runs
    (source, status, item_count, started_at, finished_at)
    values ('product-hunt', 'succeeded', 0, now(), now())$$,
  '23514',
  null,
  'unknown sources are rejected'
);
select throws_ok(
  $$insert into public.hot_items
    (section, source, source_key, article_id, title, url, position, batch_id)
    values
    ('technology', 'github', 'unsafe-story',
     '00000000-0000-0000-0000-000000000101', 'unsafe story', 'ftp://example.com/story', 2,
     '00000000-0000-0000-0000-000000000001')$$,
  '23514',
  null,
  'non-web URLs are rejected'
);

select lives_ok(
  $$insert into public.ai_events
    (id, slug, title, summary, occurred_at, status, first_published_at)
    values
    ('00000000-0000-0000-0000-000000000201', 'published-ai-event',
     'published AI event', 'published summary', now(), 'published', now()),
    ('00000000-0000-0000-0000-000000000202', 'draft-ai-event',
     'draft AI event', 'draft summary', now(), 'draft', null)$$,
  'draft and published AI events can be persisted'
);
select lives_ok(
  $$insert into public.ai_event_articles (event_id, article_id, position)
    values ('00000000-0000-0000-0000-000000000201',
            '00000000-0000-0000-0000-000000000103', 1)$$,
  'published AI events can link persistent articles'
);

set local role anon;
select results_eq(
  $$select count(*) from public.ai_events$$,
  array[1::bigint],
  'anon sees only published AI events'
);
select results_eq(
  $$select count(*) from public.ai_event_articles$$,
  array[1::bigint],
  'anon sees links for published AI events'
);
select results_eq(
  $$select count(*) from public.signal_articles$$,
  array[6::bigint],
  'anon sees all public signal articles'
);

select ok(
  not has_table_privilege('anon', 'public.signal_articles', 'INSERT,UPDATE,DELETE,TRUNCATE'),
  'anon cannot mutate signal articles'
);
set local role authenticated;
select results_eq(
  $$select count(*) from public.signal_articles$$,
  array[6::bigint],
  'authenticated sees all public signal articles'
);
select ok(
  not has_table_privilege('authenticated', 'public.signal_articles', 'INSERT,UPDATE,DELETE,TRUNCATE'),
  'authenticated cannot mutate signal articles'
);

select * from finish();
rollback;
