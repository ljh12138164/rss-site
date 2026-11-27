-- Match the homepage's per-section latest-article order.
create index if not exists signal_articles_section_published_id_idx
  on public.signal_articles (section, published_at desc nulls last, id);
