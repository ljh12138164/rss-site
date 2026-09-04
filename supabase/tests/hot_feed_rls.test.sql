begin;
select plan(18);

select has_table('public', 'hot_items', 'hot_items exists');
select has_table('public', 'source_status', 'source_status exists');
select has_table('public', 'ingestion_runs', 'ingestion_runs exists');

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

set local role anon;
select lives_ok($$select * from public.hot_items$$, 'anon reads hot items');
select lives_ok($$select * from public.source_status$$, 'anon reads source status');
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
  $$insert into public.ingestion_runs
    (id, source, status, item_count, started_at, finished_at)
    values
    ('00000000-0000-0000-0000-000000000001', 'github', 'succeeded', 1, now(), now())$$,
  'a confirmed technology source can create an ingestion run'
);
select lives_ok(
  $$insert into public.hot_items
    (section, source, source_key, title, url, position, batch_id)
    values
    ('technology', 'github', 'external-story', 'external story', 'https://example.com/story', 1,
     '00000000-0000-0000-0000-000000000001')$$,
  'technology items can link to an external web host'
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
    (section, source, source_key, title, url, position, batch_id)
    values
    ('technology', 'github', 'unsafe-story', 'unsafe story', 'ftp://example.com/story', 2,
     '00000000-0000-0000-0000-000000000001')$$,
  '23514',
  null,
  'non-web URLs are rejected'
);

select * from finish();
rollback;
