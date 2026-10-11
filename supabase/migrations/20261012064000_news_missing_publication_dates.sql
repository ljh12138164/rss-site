-- Apply after deploying the news ingestion fallback, so subsequent runs cannot restore NULL.
-- The fallback represents the last observed day in Shanghai, not an upstream publication time.
update public.signal_articles
set published_at = date_trunc('day', last_seen_at at time zone 'Asia/Shanghai') at time zone 'Asia/Shanghai'
where section = 'news' and published_at is null and not editorial_locked;

update public.hot_items h
set published_at = a.published_at
from public.signal_articles a
where h.article_id = a.id and h.section = 'news' and h.published_at is null
  and a.published_at is not null;
