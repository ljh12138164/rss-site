begin;
select plan(14);

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

select * from finish();
rollback;
