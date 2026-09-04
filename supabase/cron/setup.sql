-- Run after storing these secrets in Vault:
-- select vault.create_secret('https://your-api.vercel.app/cron/juejin', 'juejin_ingest_url');
-- select vault.create_secret('replace-with-a-random-secret', 'juejin_cron_secret');

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'juejin-hot-feed-every-five-hours',
  '0 */5 * * *',
  $$
  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'juejin_ingest_url'
    ),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'juejin_cron_secret'
      ),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('scheduled_at', now()),
    timeout_milliseconds := 30000
  ) as request_id;
  $$
);
