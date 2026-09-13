-- Manual fallback for `pnpm setup:cron`. Run only after all 37 production sources have passed
-- the API and cloud Supabase verification gate and these secrets are stored in Vault:
-- select vault.create_secret('https://your-api.vercel.app/cron/signals', 'signal_ingest_base_url');
-- select vault.create_secret('replace-with-a-random-secret', 'signal_cron_secret');

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $$
declare
  source_id text;
  job_name text;
  job_schedule text;
  legacy_job_name text;
begin
  foreach legacy_job_name in array array[
    'github-hot-feed-every-five-hours',
    'hacker-news-hot-feed-every-five-hours',
    'juejin-hot-feed-every-five-hours',
    'v2ex-hot-feed-every-five-hours',
    'signal-ingest-v2ex',
    'ithome-hot-feed-every-five-hours',
    '36kr-hot-feed-every-five-hours',
    'xinhua-news-feed-every-five-hours',
    'cctv-news-feed-every-five-hours',
    'chinanews-feed-every-five-hours',
    'thepaper-hot-feed-every-five-hours',
    'jiemian-news-feed-every-five-hours',
    'baidu-hot-feed-every-five-hours',
    'openai-news-feed-every-five-hours',
    'anthropic-news-feed-every-five-hours',
    'deepseek-news-feed-every-five-hours',
    'glm-release-feed-every-five-hours',
    'google-ai-feed-every-five-hours',
    'qwen-blog-feed-every-five-hours',
    'bilibili-popular-feed-every-five-hours',
    'zhihu-hot-feed-every-five-hours',
    'coolapk-hot-feed-every-five-hours',
    'hupu-topic-feed-every-five-hours',
    'sspai-matrix-feed-every-five-hours',
    'toutiao-hot-feed-every-five-hours',
    'signal-ingest-10jqka',
    'signal-ingest-steam'
  ]
  loop
    if exists (select 1 from cron.job where jobname = legacy_job_name) then
      perform cron.unschedule(legacy_job_name);
    end if;
  end loop;

  for source_id, job_name, job_schedule in
    select * from (values
      ('openai', 'signal-ingest-openai', '0 */2 * * *'),
      ('anthropic', 'signal-ingest-anthropic', '5 */2 * * *'),
      ('deepseek', 'signal-ingest-deepseek', '10 */2 * * *'),
      ('glm', 'signal-ingest-glm', '15 */2 * * *'),
      ('google-ai', 'signal-ingest-google-ai', '20 */2 * * *'),
      ('qwen', 'signal-ingest-qwen', '25 */2 * * *'),
      ('chatgpt', 'signal-ingest-chatgpt', '45 */2 * * *'),
      ('github', 'signal-ingest-github', '30 0,6,12,18 * * *'),
      ('hacker-news', 'signal-ingest-hacker-news', '35 0,6,12,18 * * *'),
      ('juejin', 'signal-ingest-juejin', '40 0,6,12,18 * * *'),
      ('ithome', 'signal-ingest-ithome', '50 0,6,12,18 * * *'),
      ('36kr', 'signal-ingest-36kr', '55 0,6,12,18 * * *'),
      ('xinhua', 'signal-ingest-xinhua', '0 1,7,13,19 * * *'),
      ('cctv', 'signal-ingest-cctv', '5 1,7,13,19 * * *'),
      ('chinanews', 'signal-ingest-chinanews', '10 1,7,13,19 * * *'),
      ('thepaper', 'signal-ingest-thepaper', '15 1,7,13,19 * * *'),
      ('jiemian', 'signal-ingest-jiemian', '20 1,7,13,19 * * *'),
      ('baidu', 'signal-ingest-baidu', '25 1,7,13,19 * * *'),
      ('bilibili', 'signal-ingest-bilibili', '30 1,7,13,19 * * *'),
      ('zhihu', 'signal-ingest-zhihu', '35 1,7,13,19 * * *'),
      ('coolapk', 'signal-ingest-coolapk', '40 1,7,13,19 * * *'),
      ('hupu', 'signal-ingest-hupu', '45 1,7,13,19 * * *'),
      ('sspai', 'signal-ingest-sspai', '50 1,7,13,19 * * *'),
      ('toutiao', 'signal-ingest-toutiao', '55 1,7,13,19 * * *'),
      ('wallstreetcn', 'signal-ingest-wallstreetcn', '30 2,8,14,20 * * *'),
      ('cls', 'signal-ingest-cls', '35 2,8,14,20 * * *'),
      ('jin10', 'signal-ingest-jin10', '40 2,8,14,20 * * *'),
      ('yicai', 'signal-ingest-yicai', '50 2,8,14,20 * * *'),
      ('stcn', 'signal-ingest-stcn', '55 2,8,14,20 * * *'),
      ('3dmgame', 'signal-ingest-3dmgame', '0 3,9,15,21 * * *'),
      ('gcores', 'signal-ingest-gcores', '5 3,9,15,21 * * *'),
      ('gamersky', 'signal-ingest-gamersky', '10 3,9,15,21 * * *'),
      ('ali213', 'signal-ingest-ali213', '15 3,9,15,21 * * *'),
      ('indienova', 'signal-ingest-indienova', '20 3,9,15,21 * * *'),
      ('github-blog', 'signal-ingest-github-blog', '30 3,9,15,21 * * *'),
      ('skills-trending', 'signal-ingest-skills-trending', '40 3,9,15,21 * * *'),
      ('skills-hot', 'signal-ingest-skills-hot', '50 3,9,15,21 * * *')
    ) as jobs(source_id, job_name, job_schedule)
  loop
    perform cron.schedule(
      job_name,
      job_schedule,
      format($command$
        select net.http_post(
          url := (
            select rtrim(decrypted_secret, '/')
            from vault.decrypted_secrets
            where name = 'signal_ingest_base_url'
          ) || '/%s',
          headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (
              select decrypted_secret
              from vault.decrypted_secrets
              where name = 'signal_cron_secret'
            ),
            'Content-Type', 'application/json'
          ),
          body := jsonb_build_object('scheduled_at', now(), 'source', '%s'),
          timeout_milliseconds := 45000
        ) as request_id;
      $command$, source_id, source_id)
    );
  end loop;
end
$$;

select cron.schedule(
  'ingestion-runs-retention-daily',
  '30 5 * * *',
  $$
  with expired_articles as (
    select article.id
    from public.signal_articles as article
    where article.is_pinned = false
      and article.last_seen_at < now() - case
        when article.section = 'ai' then interval '180 days'
        else interval '90 days'
      end
      and not exists (
        select 1 from public.hot_items as item where item.article_id = article.id
      )
      and not exists (
        select 1
        from public.ai_event_articles as event_article
        where event_article.article_id = article.id
      )
    order by article.last_seen_at
    limit 1000
  )
  delete from public.signal_articles as article
  using expired_articles
  where article.id = expired_articles.id;

  delete from public.ingestion_runs as run
  where run.started_at < now() - interval '30 days'
    and not exists (
      select 1 from public.hot_items as item where item.batch_id = run.id
    )
    and not exists (
      select 1 from public.source_status as source_state where source_state.last_batch_id = run.id
    );
  $$
);
