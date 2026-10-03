begin;
-- Transaction-only fixtures; no source status or Cron configuration is changed.
insert into public.ingestion_runs (source, status, started_at, finished_at)
values
  ('openai', 'succeeded', now() + interval '1 hour', now() + interval '1 hour'),
  ('openai', 'failed', now() + interval '2 hours', now() + interval '2 hours'),
  ('openai', 'running', now() + interval '3 hours', null),
  ('openai', 'failed', now() + interval '4 hours', now() + interval '4 hours');

set local role authenticated;
set local request.jwt.claims = '{"role":"authenticated","app_metadata":{"role":"article_admin"}}';
do $$
declare metrics record;
begin
  select * into metrics from public.get_ingestion_health() where source = 'openai';
  if metrics.consecutive_failures <> 2 or metrics.last_run_status <> 'failed' then
    raise exception 'Failure streak must ignore running and stop at success';
  end if;
  if exists (
    select 1 from public.get_ingestion_health()
    where sample_count > 100 or body_count > sample_count or body_count < 0
  ) then raise exception 'Invalid coverage counts'; end if;
  begin
    perform error_message from public.ingestion_runs;
    raise exception 'Admin may not read private error details';
  exception when insufficient_privilege then null;
  end;
end $$;

set local request.jwt.claims = '{"role":"authenticated","app_metadata":{},"user_metadata":{"role":"article_admin"}}';
do $$
begin
  if exists (select source from public.ingestion_runs) then
    raise exception 'Non-admin can read operational rows';
  end if;
  begin
    perform public.get_ingestion_health();
    raise exception 'User metadata must not authorize the function';
  exception when insufficient_privilege then null;
  end;
end $$;

set local role anon;
do $$
begin
  begin
    perform public.get_ingestion_health();
    raise exception 'Anonymous function access allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
select true as streak_and_rls_checks_passed;
rollback;
