-- Only administrators may read operational columns; error_message remains private.
grant select (id, source, status, item_count, started_at, finished_at)
  on public.ingestion_runs to authenticated;

create policy "Article administrators read ingestion metrics"
  on public.ingestion_runs for select to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'article_admin');

create function public.get_ingestion_health()
returns table (
  source text,
  last_success_at timestamptz,
  last_item_count integer,
  last_run_at timestamptz,
  last_run_status text,
  consecutive_failures bigint,
  sample_count bigint,
  body_count bigint
)
language plpgsql stable security invoker
set search_path = ''
as $$
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'article_admin' then
    raise exception 'Administrator role required' using errcode = '42501';
  end if;
  return query
  with latest as (
    select distinct on (r.source) r.source, r.started_at, r.status
    from public.ingestion_runs r
    order by r.source, r.started_at desc, r.id desc
  ), completed as (
    select r.source, r.status,
      sum((r.status = 'succeeded')::integer) over (
        partition by r.source order by r.started_at desc, r.id desc
        rows between unbounded preceding and current row
      ) as successes
    from public.ingestion_runs r
    where r.status in ('succeeded', 'failed')
  ), streaks as (
    select r.source, count(*) filter (where r.status = 'failed' and r.successes = 0) as failures
    from completed r group by r.source
  ), source_ids as (
    select s.source from public.source_status s
    union select r.source from latest r
  )
  select ids.source, s.last_success_at, coalesce(s.item_count, 0), l.started_at, l.status,
    coalesce(st.failures, 0), quality.total, quality.bodies
  from source_ids ids
  left join public.source_status s on s.source = ids.source
  left join latest l on l.source = ids.source
  left join streaks st on st.source = ids.source
  cross join lateral (
    select count(*) as total, count(*) filter (
      where btrim(regexp_replace(coalesce(a.content_html, ''), '<[^>]*>|&nbsp;|&#160;', '', 'g')) <> ''
        or a.content_html like '%data-cctv-video%'
    ) as bodies
    from (
      select a.content_html from public.signal_articles a
      where a.source = ids.source
      order by a.last_seen_at desc, a.id desc limit 100
    ) a
  ) quality
  order by ids.source;
end;
$$;

revoke all on function public.get_ingestion_health() from public, anon;
grant execute on function public.get_ingestion_health() to authenticated;
