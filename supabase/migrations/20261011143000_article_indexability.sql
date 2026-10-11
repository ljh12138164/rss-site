-- Filter definite placeholders without imposing a minimum article length.
create function public.article_has_indexable_content(article_title text, article_summary text, article_html text)
returns boolean
language sql immutable parallel safe
set search_path = public
as $$
  with body as (
    select coalesce(nullif(btrim(article_html), ''), article_summary, '') as html
  ), visible as (
    select regexp_replace(
      regexp_replace(
        regexp_replace(html, '<(script|style|iframe|textarea|audio)\y[^>]*>.*?</\1\s*>', '', 'gis'),
        '<a\y[^>]*>.*?</a\s*>', '', 'gis'),
      '</?(p|div|br|li|h[1-6])\y[^>]*>', E'\n', 'gi') as html
    from body
  ), plain as (
    select regexp_replace(
      regexp_replace(html, '<[^>]*>', '', 'g'),
      '&(nbsp|#160|#x[aA]0);', ' ', 'g') as text
    from visible
  ), meaningful as (
    select string_agg(line, ' ') as text
    from plain, lateral unnest(string_to_array(text, E'\n')) as lines(raw_line),
      lateral (select btrim(raw_line, E' \t\r　') as line) normalized
    where line !~ '^(记者|编导|编辑|责任编辑|制作|出品|监制|新华社音视频部制作)[：: ]'
      and line <> '新华社音视频部制作'
      and line !~* '^(Comments on Hacker News|Source|Read more|阅读全文|查看原文|求经验分享[！!]?|暂无内容)[[:space:][:punct:]]*$'
  )
  select (
    coalesce(text, '') ~ '[[:alnum:]]'
    and btrim(text) <> btrim(coalesce(article_title, ''))
  ) or (
    octet_length(coalesce(article_html, '')) <= 524288
    and (
      coalesce(article_html, '') ~* 'data-cctv-video=["''][a-f0-9]{32}["'']'
      or coalesce(article_html, '') ~* '\[!--begin:htmlVideoCode--\][a-f0-9]{32}'
    )
  )
  from meaningful;
$$;

alter table public.signal_articles
  add column is_indexable boolean generated always as (
    octet_length(coalesce(content_html, '')) <= 524288
    and public.article_has_indexable_content(title, summary, content_html)
  ) stored;

create index signal_articles_indexable_published_idx
  on public.signal_articles (published_at desc nulls last, id desc)
  where is_indexable;

comment on column public.signal_articles.is_indexable is
  'Definite placeholder filter for robots and sitemap; not a ranking or originality score.';
