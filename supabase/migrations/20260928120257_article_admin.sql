-- The browser uses its own Auth token. Only a server-assigned article_admin role may edit.
alter table public.signal_articles
  add column editorial_locked boolean not null default false;

grant update (title, summary, content_html, image_url, author, published_at, is_pinned, editorial_locked)
  on public.signal_articles to authenticated;

create policy "Article admin can edit articles" on public.signal_articles
  for update to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'article_admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'article_admin');

-- The existing article lifecycle and AI-event triggers write related tables.
-- Keep their privileged work private while the caller's article UPDATE remains RLS checked.
create schema if not exists private;
revoke all on schema private from public;
alter function public.track_article_content() set schema private;
alter function private.track_article_content() security definer;
alter function public.sync_article_ai_event() set schema private;
alter function private.sync_article_ai_event() security definer;
revoke all on function private.track_article_content() from public, anon, authenticated;
revoke all on function private.sync_article_ai_event() from public, anon, authenticated;

-- Ingestion uses a direct database connection without an Auth user. Keep edited
-- columns intact even when an older Worker version is still deployed.
create function private.preserve_editorial_article() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.editorial_locked and (select auth.uid()) is null then
    new.title := old.title;
    new.summary := old.summary;
    new.content_html := old.content_html;
    new.image_url := old.image_url;
    new.author := old.author;
    new.published_at := old.published_at;
    new.is_pinned := old.is_pinned;
    new.editorial_locked := true;
  end if;
  return new;
end;
$$;
revoke all on function private.preserve_editorial_article() from public, anon, authenticated;
create trigger article_00_preserve_editorial before update on public.signal_articles
  for each row execute function private.preserve_editorial_article();

-- The live ranking is a second table. Preserve its public fields during every
-- ingestion upsert, including from an older Worker.
create function private.preserve_editorial_hot_item() returns trigger
language plpgsql set search_path = '' as $$
declare article record;
begin
  select title, image_url, summary, author, published_at into article
    from public.signal_articles where id = new.article_id and editorial_locked;
  if found then
    new.title := article.title;
    new.image_url := article.image_url;
    new.summary := article.summary;
    new.author := article.author;
    new.published_at := article.published_at;
  end if;
  return new;
end;
$$;
revoke all on function private.preserve_editorial_hot_item() from public, anon, authenticated;
create trigger hot_item_editorial_values before insert or update on public.hot_items
  for each row execute function private.preserve_editorial_hot_item();

-- Update the current ranking atomically with the editorial article update.
create function private.sync_edited_hot_item() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.editorial_locked and
    row(new.title, new.image_url, new.summary, new.author, new.published_at)
      is distinct from
    row(old.title, old.image_url, old.summary, old.author, old.published_at) then
    update public.hot_items set
      title = new.title,
      image_url = new.image_url,
      summary = new.summary,
      author = new.author,
      published_at = new.published_at
    where article_id = new.id;
  end if;
  return null;
end;
$$;
revoke all on function private.sync_edited_hot_item() from public, anon, authenticated;
create trigger article_editorial_hot_item after update on public.signal_articles
  for each row execute function private.sync_edited_hot_item();
