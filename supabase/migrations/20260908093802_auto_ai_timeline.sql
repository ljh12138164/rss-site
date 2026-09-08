-- Automatic entries are derived from real source articles, not generated claims.
alter table public.ai_events add column auto_article_id uuid
  references public.signal_articles(id) on delete restrict;
create unique index ai_events_auto_article_unique on public.ai_events(auto_article_id);
create function public.sync_article_ai_event() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare event_id uuid;
begin
  if new.section <> 'ai' then return null; end if;
  insert into public.ai_events
    (slug,title,summary,occurred_at,status,first_published_at,auto_article_id)
  values ('ai-article-' || new.id::text,new.title,
    coalesce(nullif(btrim(new.summary),''),new.title),
    coalesce(new.published_at,new.first_seen_at),'published',now(),new.id)
  on conflict (auto_article_id) do update set
    title=excluded.title,summary=excluded.summary,occurred_at=excluded.occurred_at
  where row(ai_events.title,ai_events.summary,ai_events.occurred_at)
    is distinct from row(excluded.title,excluded.summary,excluded.occurred_at);
  select id into event_id from public.ai_events where auto_article_id=new.id;
  insert into public.ai_event_articles(event_id,article_id,position)
    values(event_id,new.id,1) on conflict do nothing;
  return null;
end;
$$;
revoke execute on function public.sync_article_ai_event() from public,anon,authenticated;
create trigger article_auto_ai_event after insert or update of title,summary,published_at
  on public.signal_articles for each row execute function public.sync_article_ai_event();

-- Backfill existing articles without modifying their timestamps or editorial events.
insert into public.ai_events
  (slug,title,summary,occurred_at,status,first_published_at,auto_article_id)
select 'ai-article-' || id::text,title,coalesce(nullif(btrim(summary),''),title),
  coalesce(published_at,first_seen_at),'published',now(),id
from public.signal_articles where section='ai'
on conflict (auto_article_id) do nothing;
insert into public.ai_event_articles(event_id,article_id,position)
select id,auto_article_id,1 from public.ai_events where auto_article_id is not null
on conflict do nothing;
