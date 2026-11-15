create or replace function private.activate_verified_business_jobs(evidence jsonb)
returns void language plpgsql set search_path='' as $$
declare
  item record;
begin
  if jsonb_typeof(evidence) is distinct from 'object'
     or (evidence->>'database_major')::integer is distinct from 18
     or (evidence->>'old_writers_disabled')::boolean is distinct from true
     or coalesce((evidence->>'verified_at')::timestamptz between now()-interval '2 hours' and now()+interval '5 minutes',false)=false
     or jsonb_typeof(evidence->'verified_jobs') is distinct from 'array'
     or jsonb_array_length(evidence->'verified_jobs')=0
     or exists (
       select 1
       from jsonb_array_elements(evidence->'verified_jobs') as v(entry)
       where jsonb_typeof(v.entry) is distinct from 'string'
          or not exists (
            select 1 from private.business_cron_jobs j where j.source=(v.entry #>> '{}')
          )
     ) then
    raise exception 'Fresh verified acceptance and old-writer shutdown required';
  end if;

  for item in
    select j.jobid
    from cron.job j
    join private.business_cron_jobs b on j.jobname='rss-site-' || b.source
    where b.source in (select jsonb_array_elements_text(evidence->'verified_jobs'))
  loop
    perform cron.alter_job(item.jobid,active := true);
  end loop;

  update private.business_cron_jobs
  set verified=true
  where source in (select jsonb_array_elements_text(evidence->'verified_jobs'));
end;
$$;

create or replace function private.activate_business_jobs(evidence jsonb)
returns void language plpgsql set search_path='' as $$
begin
  if jsonb_typeof(evidence) is distinct from 'object'
     or jsonb_typeof(evidence->'verified_jobs') is distinct from 'array'
     or exists (
       select 1 from private.business_cron_jobs j
       where not coalesce(evidence->'verified_jobs' ? j.source,false)
     ) then
    raise exception 'Fresh complete acceptance and old-writer shutdown required';
  end if;
  perform private.activate_verified_business_jobs(evidence);
end;
$$;

revoke all on function private.activate_verified_business_jobs(jsonb),
  private.activate_business_jobs(jsonb) from public;
