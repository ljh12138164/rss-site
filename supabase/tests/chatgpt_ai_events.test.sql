begin;
select plan(6);

select lives_ok(
  $$insert into public.signal_articles
    (id, section, source, source_key, title, url, published_at)
    values
    ('10000000-0000-0000-0000-000000000001', 'ai', 'openai', 'openai-news',
     'OpenAI company news', 'https://openai.com/index/company-news', now())$$,
  'OpenAI comprehensive news remains a valid AI article source'
);

select lives_ok(
  $$insert into public.signal_articles
    (id, section, source, source_key, title, url, published_at)
    values
    ('10000000-0000-0000-0000-000000000002', 'ai', 'chatgpt', 'chatgpt-release',
     'ChatGPT release', 'https://help.openai.com/en/articles/6825453-chatgpt-release-notes', now())$$,
  'ChatGPT release notes are a valid AI article source'
);

select lives_ok(
  $$insert into public.signal_articles
    (id, section, source, source_key, title, url, published_at)
    values
    ('10000000-0000-0000-0000-000000000003', 'ai', 'anthropic', 'anthropic-news',
     'Anthropic news', 'https://www.anthropic.com/news/example', now())$$,
  'other AI article sources remain valid'
);

select results_eq(
  $$select count(*)
    from public.ai_events
    where auto_article_id = '10000000-0000-0000-0000-000000000001'::uuid$$,
  array[0::bigint],
  'OpenAI comprehensive news does not create an automatic AI event'
);

select results_eq(
  $$select count(*)
    from public.ai_events
    where auto_article_id in (
      '10000000-0000-0000-0000-000000000002'::uuid,
      '10000000-0000-0000-0000-000000000003'::uuid
    )$$,
  array[2::bigint],
  'ChatGPT and other AI articles create automatic AI events'
);

select results_eq(
  $$select count(*)
    from public.ai_event_articles
    where article_id = '10000000-0000-0000-0000-000000000002'::uuid$$,
  array[1::bigint],
  'the ChatGPT event links back to its source article'
);

select * from finish();
rollback;
