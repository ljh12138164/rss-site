-- Keep upstream HTML untrusted; only the server-side reader may render it after sanitizing.
alter table public.signal_articles add column content_html text
  check (content_html is null or octet_length(content_html) <= 524288);

-- Preserve the historical 'news' tombstone kind for existing URLs; source/UUID identifies all sections.
create or replace function public.track_article_content() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    insert into public.content_tombstones(kind, key) values ('news', old.source || '/' || old.id::text)
      on conflict (kind, key) do update set removed_at = now();
    return old;
  end if;
  if row(new.title, new.url, new.summary, new.content_html, new.author, new.published_at)
    is distinct from row(old.title, old.url, old.summary, old.content_html, old.author, old.published_at) then
    new.content_updated_at := now();
    update public.ai_events set updated_at = now()
      where id in (select event_id from public.ai_event_articles where article_id = old.id);
  else
    new.content_updated_at := old.content_updated_at;
  end if;
  return new;
end;
$$;
revoke execute on function public.track_article_content() from public, anon, authenticated;
