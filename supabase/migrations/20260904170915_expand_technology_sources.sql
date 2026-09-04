alter table public.ingestion_runs
  drop constraint ingestion_runs_source_check,
  add constraint ingestion_runs_source_check check (
    source in ('github', 'hacker-news', 'juejin', 'v2ex', 'ithome', '36kr')
  );

alter table public.source_status
  drop constraint source_status_source_check,
  add constraint source_status_source_check check (
    source in ('github', 'hacker-news', 'juejin', 'v2ex', 'ithome', '36kr')
  );

alter table public.hot_items
  drop constraint hot_items_source_check,
  drop constraint hot_items_url_check,
  add constraint hot_items_source_check check (
    source in ('github', 'hacker-news', 'juejin', 'v2ex', 'ithome', '36kr')
  ),
  add constraint hot_items_url_check check (url ~ '^https?://');
