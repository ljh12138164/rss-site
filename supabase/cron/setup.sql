-- Manual fallback for `pnpm setup:cron`. Run after storing these secrets in Vault:
-- select vault.create_secret('https://your-api.vercel.app/cron/technology', 'technology_ingest_base_url');
-- select vault.create_secret('replace-with-a-random-secret', 'technology_cron_secret');

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
      ('36kr', '36kr-hot-feed-every-five-hours', '50 0,5,10,15,20 * * *')
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
            where name = 'technology_ingest_base_url'
          ) || '/%s',
          headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (
              select decrypted_secret
              from vault.decrypted_secrets
              where name = 'technology_cron_secret'
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
