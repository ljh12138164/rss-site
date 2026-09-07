-- Public tombstones contain identifiers only, never deleted article contents.
create table public.content_tombstones (
  kind text not null check (kind in ('news', 'event')),
  key text not null,
  removed_at timestamptz not null default now(),
  primary key (kind, key)
);
alter table public.content_tombstones enable row level security;
revoke all on public.content_tombstones from anon, authenticated;
grant select on public.content_tombstones to anon, authenticated;
grant all on public.content_tombstones to service_role;
create policy "Public can read removed identifiers" on public.content_tombstones
  for select to anon, authenticated using (true);

alter table public.signal_articles add column content_updated_at timestamptz;
update public.signal_articles set content_updated_at = first_seen_at;
alter table public.signal_articles alter column content_updated_at set default now();
alter table public.signal_articles alter column content_updated_at set not null;

create function public.track_article_content() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if old.section = 'news' then
      insert into public.content_tombstones(kind, key) values ('news', old.source || '/' || old.id::text)
        on conflict (kind, key) do update set removed_at = now();
    end if;
    return old;
  end if;
  if row(new.title, new.url, new.summary, new.author, new.published_at)
    is distinct from row(old.title, old.url, old.summary, old.author, old.published_at) then
    new.content_updated_at := now();
    update public.ai_events set updated_at = now()
      where id in (select event_id from public.ai_event_articles where article_id = old.id);
  else
    new.content_updated_at := old.content_updated_at;
  end if;
  return new;
end;
$$;
create trigger article_content_lifecycle before update or delete on public.signal_articles
  for each row execute function public.track_article_content();

create function public.track_event_content() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if old.first_published_at is not null then
      insert into public.content_tombstones(kind, key) values ('event', old.slug)
        on conflict (kind, key) do update set removed_at = now();
    end if;
    return old;
  end if;
  if tg_op = 'UPDATE' then
    if new.slug is distinct from old.slug then
      raise exception 'Event slug is immutable';
    end if;
    if old.first_published_at is not null and new.first_published_at is distinct from old.first_published_at then
      raise exception 'First publication time is immutable';
    end if;
    if row(new.title, new.summary, new.occurred_at, new.status)
      is distinct from row(old.title, old.summary, old.occurred_at, old.status) then
      new.updated_at := now();
    end if;
  end if;
  if new.status = 'archived' then
    insert into public.content_tombstones(kind, key) values ('event', new.slug)
      on conflict (kind, key) do update set removed_at = now();
  elsif new.status = 'published' then
    delete from public.content_tombstones where kind = 'event' and key = new.slug;
  end if;
  return new;
end;
$$;
create trigger event_content_lifecycle before insert or update or delete on public.ai_events
  for each row execute function public.track_event_content();

create function public.touch_linked_event() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op <> 'INSERT' then
    update public.ai_events set updated_at = now() where id = old.event_id;
  end if;
  if tg_op <> 'DELETE' then
    update public.ai_events set updated_at = now() where id = new.event_id;
  end if;
  return null;
end;
$$;
create trigger event_links_changed after insert or update or delete on public.ai_event_articles
  for each row execute function public.touch_linked_event();
revoke execute on function public.track_article_content(), public.track_event_content(), public.touch_linked_event() from public, anon, authenticated;

create index ai_events_timeline_idx on public.ai_events(occurred_at desc, id) where status = 'published';

insert into public.content_tombstones(kind, key)
  select 'event', slug from public.ai_events where status = 'archived'
  on conflict (kind, key) do nothing;

-- pg_net sends queued requests only after the deletion transaction commits.
-- Keep cleanup independent of publication availability and never expose Vault values.
create function public.notify_deleted_articles() returns trigger
language plpgsql set search_path = '' as $$
declare
  web_url text;
  web_secret text;
  affected record;
begin
  if not exists (select 1 from deleted_articles) then return null; end if;
  select decrypted_secret into web_url from vault.decrypted_secrets where name = 'signal_web_url';
  select decrypted_secret into web_secret from vault.decrypted_secrets where name = 'signal_revalidate_secret';
  if web_url is null or web_secret is null then
    raise warning 'Content deletion committed without publication notification: Web Vault configuration missing';
    return null;
  end if;
  for affected in select distinct section, source from deleted_articles loop
    perform net.http_post(
      url := rtrim(web_url, '/') || '/api/revalidate',
      headers := jsonb_build_object('Authorization', 'Bearer ' || web_secret, 'Content-Type', 'application/json'),
      body := jsonb_build_object('section', affected.section, 'source', affected.source),
      timeout_milliseconds := 5000
    );
  end loop;
  return null;
exception when others then
  raise warning 'Content deletion committed but publication notification could not be queued';
  return null;
end;
$$;
revoke execute on function public.notify_deleted_articles() from public, anon, authenticated;
create trigger articles_deleted_publication after delete on public.signal_articles
  referencing old table as deleted_articles for each statement execute function public.notify_deleted_articles();
