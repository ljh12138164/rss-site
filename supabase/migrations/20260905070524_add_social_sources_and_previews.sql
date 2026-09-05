alter table public.ingestion_runs
  drop constraint ingestion_runs_source_check,
  add constraint ingestion_runs_source_check check (
    source in (
      'github', 'hacker-news', 'juejin', 'v2ex', 'ithome', '36kr',
      'xinhua', 'cctv', 'chinanews', 'thepaper', 'jiemian', 'baidu',
      'openai', 'anthropic', 'deepseek', 'glm', 'google-ai', 'qwen',
      'bilibili', 'zhihu', 'coolapk', 'hupu', 'sspai', 'toutiao'
    )
  );

alter table public.source_status
  drop constraint source_status_source_section_check,
  add constraint source_status_source_section_check check (
    (section = 'technology' and source in ('github', 'hacker-news', 'juejin', 'v2ex', 'ithome', '36kr'))
    or
    (section = 'news' and source in ('xinhua', 'cctv', 'chinanews', 'thepaper', 'jiemian', 'baidu'))
    or
    (section = 'ai' and source in ('openai', 'anthropic', 'deepseek', 'glm', 'google-ai', 'qwen'))
    or
    (section = 'social' and source in ('bilibili', 'zhihu', 'coolapk', 'hupu', 'sspai', 'toutiao'))
  );

alter table public.hot_items
  add column image_url text,
  drop constraint hot_items_source_section_check,
  add constraint hot_items_source_section_check check (
    (section = 'technology' and source in ('github', 'hacker-news', 'juejin', 'v2ex', 'ithome', '36kr'))
    or
    (section = 'news' and source in ('xinhua', 'cctv', 'chinanews', 'thepaper', 'jiemian', 'baidu'))
    or
    (section = 'ai' and source in ('openai', 'anthropic', 'deepseek', 'glm', 'google-ai', 'qwen'))
    or
    (section = 'social' and source in ('bilibili', 'zhihu', 'coolapk', 'hupu', 'sspai', 'toutiao'))
  ),
  add constraint hot_items_image_url_check check (image_url is null or image_url ~ '^https?://');
