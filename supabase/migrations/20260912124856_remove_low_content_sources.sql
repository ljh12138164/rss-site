do $$
declare
  job_name text;
begin
  foreach job_name in array array[
    'signal-ingest-v2ex',
    'signal-ingest-10jqka',
    'signal-ingest-steam',
    'v2ex-hot-feed-every-five-hours'
  ]
  loop
    if exists (select 1 from cron.job where jobname = job_name) then
      perform cron.unschedule(job_name);
    end if;
  end loop;
end
$$;

delete from public.ai_events
where auto_article_id in (
  select id from public.signal_articles where source in ('v2ex', '10jqka', 'steam')
);

delete from public.ai_event_articles
where article_id in (
  select id from public.signal_articles where source in ('v2ex', '10jqka', 'steam')
);

delete from public.hot_items where source in ('v2ex', '10jqka', 'steam');
delete from public.source_status where source in ('v2ex', '10jqka', 'steam');
delete from public.signal_articles where source in ('v2ex', '10jqka', 'steam');
delete from public.ingestion_runs where source in ('v2ex', '10jqka', 'steam');

alter table public.ingestion_runs
  drop constraint ingestion_runs_source_check,
  add constraint ingestion_runs_source_check check (
    source in (
      'github', 'github-blog', 'hacker-news', 'juejin', 'ithome', '36kr',
      'xinhua', 'cctv', 'chinanews', 'thepaper', 'jiemian', 'baidu',
      'openai', 'anthropic', 'deepseek', 'glm', 'google-ai', 'qwen',
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
    (section = 'ai' and source in ('openai', 'anthropic', 'deepseek', 'glm', 'google-ai', 'qwen'))
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
    (section = 'ai' and source in ('openai', 'anthropic', 'deepseek', 'glm', 'google-ai', 'qwen'))
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
    (section = 'ai' and source in ('openai', 'anthropic', 'deepseek', 'glm', 'google-ai', 'qwen'))
    or
    (section = 'social' and source in ('bilibili', 'zhihu', 'coolapk', 'hupu', 'sspai', 'toutiao'))
    or
    (section = 'finance' and source in ('wallstreetcn', 'cls', 'jin10', 'yicai', 'stcn'))
    or
    (section = 'games' and source in ('3dmgame', 'gcores', 'gamersky', 'ali213', 'indienova'))
  );
