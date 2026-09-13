alter table public.ingestion_runs
  drop constraint ingestion_runs_source_check,
  add constraint ingestion_runs_source_check check (
    source in (
      'github', 'github-blog', 'hacker-news', 'juejin', 'ithome', '36kr',
      'xinhua', 'cctv', 'chinanews', 'thepaper', 'jiemian', 'baidu',
      'openai', 'chatgpt', 'anthropic', 'deepseek', 'glm', 'google-ai', 'qwen',
      'bilibili', 'zhihu', 'coolapk', 'hupu', 'sspai', 'toutiao',
      'wallstreetcn', 'cls', 'jin10', 'yicai', 'stcn',
      '3dmgame', 'gcores', 'gamersky', 'ali213', 'indienova',
      'skills-trending', 'skills-hot'
    )
  );

alter table public.source_status
  drop constraint source_status_source_section_check,
  add constraint source_status_source_section_check check (
    (section = 'technology' and source in ('github', 'github-blog', 'hacker-news', 'juejin', 'ithome', '36kr'))
    or (section = 'news' and source in ('xinhua', 'cctv', 'chinanews', 'thepaper', 'jiemian', 'baidu'))
    or (section = 'ai' and source in ('openai', 'chatgpt', 'anthropic', 'deepseek', 'glm', 'google-ai', 'qwen'))
    or (section = 'social' and source in ('bilibili', 'zhihu', 'coolapk', 'hupu', 'sspai', 'toutiao'))
    or (section = 'finance' and source in ('wallstreetcn', 'cls', 'jin10', 'yicai', 'stcn'))
    or (section = 'games' and source in ('3dmgame', 'gcores', 'gamersky', 'ali213', 'indienova'))
    or (section = 'skills' and source in ('skills-trending', 'skills-hot'))
  );

alter table public.hot_items
  drop constraint hot_items_source_section_check,
  add constraint hot_items_source_section_check check (
    (section = 'technology' and source in ('github', 'github-blog', 'hacker-news', 'juejin', 'ithome', '36kr'))
    or (section = 'news' and source in ('xinhua', 'cctv', 'chinanews', 'thepaper', 'jiemian', 'baidu'))
    or (section = 'ai' and source in ('openai', 'chatgpt', 'anthropic', 'deepseek', 'glm', 'google-ai', 'qwen'))
    or (section = 'social' and source in ('bilibili', 'zhihu', 'coolapk', 'hupu', 'sspai', 'toutiao'))
    or (section = 'finance' and source in ('wallstreetcn', 'cls', 'jin10', 'yicai', 'stcn'))
    or (section = 'games' and source in ('3dmgame', 'gcores', 'gamersky', 'ali213', 'indienova'))
    or (section = 'skills' and source in ('skills-trending', 'skills-hot'))
  );

alter table public.signal_articles
  drop constraint signal_articles_source_section_check,
  add constraint signal_articles_source_section_check check (
    (section = 'technology' and source in ('github', 'github-blog', 'hacker-news', 'juejin', 'ithome', '36kr'))
    or (section = 'news' and source in ('xinhua', 'cctv', 'chinanews', 'thepaper', 'jiemian', 'baidu'))
    or (section = 'ai' and source in ('openai', 'chatgpt', 'anthropic', 'deepseek', 'glm', 'google-ai', 'qwen'))
    or (section = 'social' and source in ('bilibili', 'zhihu', 'coolapk', 'hupu', 'sspai', 'toutiao'))
    or (section = 'finance' and source in ('wallstreetcn', 'cls', 'jin10', 'yicai', 'stcn'))
    or (section = 'games' and source in ('3dmgame', 'gcores', 'gamersky', 'ali213', 'indienova'))
    or (section = 'skills' and source in ('skills-trending', 'skills-hot'))
  );
