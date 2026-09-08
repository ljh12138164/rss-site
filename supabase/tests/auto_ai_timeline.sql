begin;
do $test$
declare a uuid; e uuid; slug_before text; first_before timestamptz; n bigint;
begin
 select id into a from public.signal_articles where section='ai' limit 1;
 select id,slug,first_published_at into e,slug_before,first_before from public.ai_events where auto_article_id=a;
 select count(*) into n from public.ai_events;
 update public.signal_articles set title=title where id=a;
 if (select count(*) from public.ai_events)<>n then raise exception 'duplicate event'; end if;
 update public.signal_articles set title=title || ' regression-check' where id=a;
 if not exists(select 1 from public.ai_events ev join public.signal_articles ar on ar.id=ev.auto_article_id where ev.id=e and ev.title=ar.title and ev.slug=slug_before and ev.first_published_at=first_before) then raise exception 'update or identity failed'; end if;
 if (select count(*) from public.ai_event_articles where event_id=e and article_id=a)<>1 then raise exception 'source link failed'; end if;
 update public.ai_events set status='archived' where id=e;
 update public.signal_articles set title=title || ' again' where id=a;
 if (select status from public.ai_events where id=e)<>'archived' then raise exception 'archive overwritten'; end if;
end;
$test$;
rollback;
