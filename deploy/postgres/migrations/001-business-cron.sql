-- Idempotent deployment migration. Run only through the privileged deployment connection.
create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists private.business_cron_settings (
  singleton boolean primary key default true check (singleton),
  secret text not null check (length(secret)>0)
);
create table if not exists private.business_cron_jobs (
  source text primary key,
  schedule text not null,
  path text not null,
  verified boolean not null default false
);
create table if not exists private.business_cron_requests (
  request_id bigint primary key,
  source text not null,
  attempt integer not null default 1,
  retried boolean not null default false,
  requested_at timestamptz not null default now()
);

create or replace function private.dispatch_business_job(job_source text, retry_attempt integer default 1)
returns bigint language plpgsql set search_path='' as $$
declare
  endpoint text;
  token text;
  request_id bigint;
begin
  select path into strict endpoint from private.business_cron_jobs where source=job_source;
  select secret into strict token from private.business_cron_settings where singleton;
  select net.http_post(
    url := 'http://web:3000' || endpoint,
    body := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || token),
    timeout_milliseconds := 180000
  ) into request_id;
  insert into private.business_cron_requests(request_id,source,attempt)
    values (request_id,job_source,retry_attempt)
    -- pg_net's unlogged sequence resets after a crash or logical restore.
    on conflict on constraint business_cron_requests_pkey do update set source=excluded.source,attempt=excluded.attempt,
      retried=false,requested_at=excluded.requested_at;
  return request_id;
end;
$$;

create or replace function private.activate_business_jobs(evidence jsonb)
returns void language plpgsql set search_path='' as $$
declare item record;
begin
  if (evidence->>'database_major')::integer is distinct from 18
     or (evidence->>'old_writers_disabled')::boolean is distinct from true
     or coalesce((evidence->>'verified_at')::timestamptz between now()-interval '2 hours' and now()+interval '5 minutes',false)=false
     or exists (select 1 from private.business_cron_jobs j
       where not coalesce(evidence->'verified_jobs' ? j.source,false)) then
    raise exception 'Fresh complete acceptance and old-writer shutdown required';
  end if;
  for item in select j.jobid from cron.job j join private.business_cron_jobs b
    on j.jobname='rss-site-' || b.source loop
    perform cron.alter_job(item.jobid,active := true);
  end loop;
  update private.business_cron_jobs set verified=true;
end;
$$;

-- Preserve the former bounded 202 polling without an external Python process.
create or replace function private.retry_pending_business_jobs()
returns void language plpgsql set search_path='' as $$
declare item record;
begin
  for item in select r.request_id,r.source,r.attempt
    from private.business_cron_requests r join net._http_response h on h.id=r.request_id
    join private.business_cron_jobs j on j.source=r.source and j.verified
    where h.status_code=202 and not r.retried and r.attempt<8
      and r.requested_at>now()-interval '1 hour' and r.requested_at<now()-interval '30 seconds'
    for update of r skip locked loop
    update private.business_cron_requests set retried=true where request_id=item.request_id;
    perform private.dispatch_business_job(item.source,item.attempt+1);
  end loop;
end;
$$;

create or replace function private.sync_business_jobs(desired jsonb)
returns void language plpgsql set search_path='' as $$
declare
  item record;
  job_id bigint;
begin
  if jsonb_typeof(desired)<>'array' or jsonb_array_length(desired)=0 then
    raise exception 'Empty business job configuration';
  end if;
  for item in select * from jsonb_to_recordset(desired) as j(source text,schedule text,path text) loop
    if item.source !~ '^[a-z0-9-]+$' or item.schedule is null
       or item.path not in ('/cron/signals/' || item.source,
          '/cron/maintenance/retention','/cron/maintenance/zhihu-cookie','/cron/maintenance/publication-outbox',
          '/cron/maintenance/hot-ranking-log-retention') then
      raise exception 'Invalid business job';
    end if;
    insert into private.business_cron_jobs as current(source,schedule,path)
      values (item.source,item.schedule,item.path)
      on conflict (source) do update set schedule=excluded.schedule,path=excluded.path,
        verified=current.verified and current.path=excluded.path;
    select cron.schedule('rss-site-' || item.source,item.schedule,
      format('select private.dispatch_business_job(%L)',item.source)) into job_id;
    perform cron.alter_job(job_id,active := (
      select verified from private.business_cron_jobs where source=item.source
    ));
  end loop;
  for item in select source from private.business_cron_jobs
    where source not in (select j->>'source' from jsonb_array_elements(desired) j) loop
    perform cron.unschedule('rss-site-' || item.source);
    delete from private.business_cron_jobs where source=item.source;
  end loop;
end;
$$;

-- HTTP enqueue success is distinct from HTTP execution success.
create or replace view private.business_cron_history as
select r.request_id,r.source,r.requested_at,h.status_code,h.timed_out,
  case when h.id is null then 'pending_or_expired'
       when h.error_msg is not null or h.timed_out then 'failed'
       when h.status_code=202 and r.attempt>=8 then 'failed'
       when h.status_code=202 then 'pending'
       when h.status_code between 200 and 299 then 'succeeded'
       else 'failed' end as status
from private.business_cron_requests r left join net._http_response h on h.id=r.request_id;

revoke all on schema cron,net from public;
revoke all on all tables in schema cron,net from public;
revoke all on all sequences in schema net from public;
revoke all on all functions in schema cron,net from public;
revoke all on private.business_cron_settings,private.business_cron_jobs,
  private.business_cron_requests,private.business_cron_history from public;
revoke all on function private.dispatch_business_job(text,integer),private.sync_business_jobs(jsonb),
  private.retry_pending_business_jobs(),private.activate_business_jobs(jsonb) from public;

-- Only task bookkeeping is cleaned here; business retention remains in the application.
select cron.schedule('rss-site-cron-history-cleanup','15 5 * * *',
  $command$delete from cron.job_run_details where end_time<now()-interval '7 days';
  delete from private.business_cron_requests where requested_at<now()-interval '7 days'$command$);
select cron.schedule('rss-site-cron-pending','30 seconds','select private.retry_pending_business_jobs()');
