alter table public.ingestion_runs
  drop constraint ingestion_runs_source_check,
  add constraint ingestion_runs_source_check check (
    source in (
      'github', 'github-blog', 'hacker-news', 'juejin', 'ithome', '36kr',
      'xinhua', 'cctv', 'chinanews', 'thepaper', 'jiemian', 'baidu',
      'openai', 'chatgpt', 'anthropic', 'deepseek', 'glm', 'google-ai', 'qwen',
      'bilibili', 'zhihu', 'coolapk', 'hupu', 'sspai', 'toutiao',
      'wallstreetcn', 'cls', 'jin10', 'yicai', 'stcn',
      '3dmgame', 'gcores', 'gamersky', 'ali213', 'indienova'
    )
  );

alter table public.source_status
  drop constraint source_status_source_section_check,
  add constraint source_status_source_section_check check (
    (section = 'technology' and source in ('github', 'github-blog', 'hacker-news', 'juejin', 'ithome', '36kr'))
    or
    (section = 'news' and source in ('xinhua', 'cctv', 'chinanews', 'thepaper', 'jiemian', 'baidu'))
    or
    (section = 'ai' and source in ('openai', 'chatgpt', 'anthropic', 'deepseek', 'glm', 'google-ai', 'qwen'))
    or
    (section = 'social' and source in ('bilibili', 'zhihu', 'coolapk', 'hupu', 'sspai', 'toutiao'))
    or
    (section = 'finance' and source in ('wallstreetcn', 'cls', 'jin10', 'yicai', 'stcn'))
    or
    (section = 'games' and source in ('3dmgame', 'gcores', 'gamersky', 'ali213', 'indienova'))
  );

alter table public.hot_items
  drop constraint hot_items_source_section_check,
  add constraint hot_items_source_section_check check (
    (section = 'technology' and source in ('github', 'github-blog', 'hacker-news', 'juejin', 'ithome', '36kr'))
    or
    (section = 'news' and source in ('xinhua', 'cctv', 'chinanews', 'thepaper', 'jiemian', 'baidu'))
    or
    (section = 'ai' and source in ('openai', 'chatgpt', 'anthropic', 'deepseek', 'glm', 'google-ai', 'qwen'))
    or
    (section = 'social' and source in ('bilibili', 'zhihu', 'coolapk', 'hupu', 'sspai', 'toutiao'))
    or
    (section = 'finance' and source in ('wallstreetcn', 'cls', 'jin10', 'yicai', 'stcn'))
    or
    (section = 'games' and source in ('3dmgame', 'gcores', 'gamersky', 'ali213', 'indienova'))
  );

alter table public.signal_articles
  drop constraint signal_articles_source_section_check,
  add constraint signal_articles_source_section_check check (
    (section = 'technology' and source in ('github', 'github-blog', 'hacker-news', 'juejin', 'ithome', '36kr'))
    or
    (section = 'news' and source in ('xinhua', 'cctv', 'chinanews', 'thepaper', 'jiemian', 'baidu'))
    or
    (section = 'ai' and source in ('openai', 'chatgpt', 'anthropic', 'deepseek', 'glm', 'google-ai', 'qwen'))
    or
    (section = 'social' and source in ('bilibili', 'zhihu', 'coolapk', 'hupu', 'sspai', 'toutiao'))
    or
    (section = 'finance' and source in ('wallstreetcn', 'cls', 'jin10', 'yicai', 'stcn'))
    or
    (section = 'games' and source in ('3dmgame', 'gcores', 'gamersky', 'ali213', 'indienova'))
  );

create or replace function public.sync_article_ai_event() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare event_id uuid;
begin
  if new.section <> 'ai' or new.source = 'openai' then
    delete from public.ai_events where auto_article_id = new.id;
    return null;
  end if;

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

drop trigger article_auto_ai_event on public.signal_articles;
create trigger article_auto_ai_event
  after insert or update of title,summary,published_at,section,source
  on public.signal_articles for each row execute function public.sync_article_ai_event();

delete from public.ai_events as event
using public.signal_articles as article
where event.auto_article_id = article.id
  and article.section = 'ai'
  and article.source = 'openai';
