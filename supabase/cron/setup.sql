-- Manual fallback for `pnpm setup:cron`. Run after storing these secrets in Vault:
-- select vault.create_secret('https://your-api.vercel.app/cron/signals', 'signal_ingest_base_url');
-- select vault.create_secret('replace-with-a-random-secret', 'signal_cron_secret');

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $$
declare
  source_id text;
  job_name text;
  job_schedule text;
begin
  for source_id, job_name, job_schedule in
    select * from (values
      ('github', 'github-hot-feed-every-five-hours', '0 0,5,10,15,20 * * *'),
      ('hacker-news', 'hacker-news-hot-feed-every-five-hours', '10 0,5,10,15,20 * * *'),
      ('juejin', 'juejin-hot-feed-every-five-hours', '20 0,5,10,15,20 * * *'),
      ('v2ex', 'v2ex-hot-feed-every-five-hours', '30 0,5,10,15,20 * * *'),
      ('ithome', 'ithome-hot-feed-every-five-hours', '40 0,5,10,15,20 * * *'),
      ('36kr', '36kr-hot-feed-every-five-hours', '50 0,5,10,15,20 * * *'),
      ('xinhua', 'xinhua-news-feed-every-five-hours', '0 1,6,11,16,21 * * *'),
      ('cctv', 'cctv-news-feed-every-five-hours', '10 1,6,11,16,21 * * *'),
      ('chinanews', 'chinanews-feed-every-five-hours', '20 1,6,11,16,21 * * *'),
      ('thepaper', 'thepaper-hot-feed-every-five-hours', '30 1,6,11,16,21 * * *'),
      ('jiemian', 'jiemian-news-feed-every-five-hours', '40 1,6,11,16,21 * * *'),
      ('baidu', 'baidu-hot-feed-every-five-hours', '50 1,6,11,16,21 * * *'),
      ('openai', 'openai-news-feed-every-five-hours', '0 2,7,12,17,22 * * *'),
      ('anthropic', 'anthropic-news-feed-every-five-hours', '10 2,7,12,17,22 * * *'),
      ('deepseek', 'deepseek-news-feed-every-five-hours', '20 2,7,12,17,22 * * *'),
      ('glm', 'glm-release-feed-every-five-hours', '30 2,7,12,17,22 * * *'),
      ('google-ai', 'google-ai-feed-every-five-hours', '40 2,7,12,17,22 * * *'),
      ('qwen', 'qwen-blog-feed-every-five-hours', '50 2,7,12,17,22 * * *'),
      ('bilibili', 'bilibili-popular-feed-every-five-hours', '0 3,8,13,18,23 * * *'),
      ('zhihu', 'zhihu-hot-feed-every-five-hours', '10 3,8,13,18,23 * * *'),
      ('coolapk', 'coolapk-hot-feed-every-five-hours', '20 3,8,13,18,23 * * *'),
      ('hupu', 'hupu-topic-feed-every-five-hours', '30 3,8,13,18,23 * * *'),
      ('sspai', 'sspai-matrix-feed-every-five-hours', '40 3,8,13,18,23 * * *'),
      ('toutiao', 'toutiao-hot-feed-every-five-hours', '50 3,8,13,18,23 * * *')
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
  '30 3 * * *',
  $$
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
