-- Fix greedy attribute matching in article_has_indexable_content and recompute stale generated rows once without schema locks.
create or replace function public.article_has_indexable_content(
  article_title text,
  article_summary text,
  article_html text
) returns boolean
language sql immutable parallel safe
set search_path to 'public'
as $_$
  with body as (
    select coalesce(nullif(btrim(article_html), ''), article_summary, '') as html
  ), stripped_embeds as (
    select
      case when position('<' in html) = 0 or html !~* '<(script|style|iframe|textarea|audio)\y' then html else
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                regexp_replace(html, '<script\y[^>]*?>.*?</script\s*>', '', 'gis'),
              '<style\y[^>]*?>.*?</style\s*>', '', 'gis'),
            '<iframe\y[^>]*?>.*?</iframe\s*>', '', 'gis'),
          '<textarea\y[^>]*?>.*?</textarea\s*>', '', 'gis'),
        '<audio\y[^>]*?>.*?</audio\s*>', '', 'gis')
      end as html
    from body
  ), stripped_anchors as (
    select
      case when position('<' in html) = 0 or html !~* '<a\y' then html else
        regexp_replace(html, '<a\y[^>]*?>.*?</a\s*>', '', 'gis')
      end as html
    from stripped_embeds
  ), visible as (
    select regexp_replace(html, '</?(p|div|br|li|h[1-6])\y[^>]*>', E'\n', 'gi') as html
    from stripped_anchors
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
      and line !~* '^(Comments on Hacker News|Source|Read more|Share|阅读全文|查看原文|求经验分享[！!]?|暂无内容)[[:space:][:punct:]]*$'
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
$_$;

do $$
begin
  if not exists (
    select 1
    from private.maintenance_state
    where name = 'article_indexability_regex_v2_backfilled'
  ) then
    -- Updating content_html = content_html forces stored generated column recalculation without tripping
    -- article_auto_ai_event or advancing content_updated_at when article columns are unchanged.
    -- Narrowing to rows that could possibly change avoids de-TOASTing ~73k healthy long historical articles.
    update public.signal_articles
    set content_html = content_html
    where (
      (
        not is_indexable
        and coalesce(nullif(btrim(content_html), ''), summary, '') ~* '<(a|script|style|iframe|textarea|audio)\y'
      )
      or id in (select article_id from public.hot_items)
      or (
        is_indexable
        and coalesce(octet_length(content_html), 0) <= 16384
        and (
          coalesce(content_html, '') ~* 'Share'
          or btrim(coalesce(summary, ''), E' \t\r\n　') ~* '^Share[[:space:][:punct:]]*$'
        )
      )
    )
      and is_indexable is distinct from (
        octet_length(coalesce(content_html, '')) <= 524288
        and public.article_has_indexable_content(title, summary, content_html)
      );

    insert into private.maintenance_state(name, value)
    values (
      'article_indexability_regex_v2_backfilled',
      jsonb_build_object('completed_at', now())
    )
    on conflict (name) do update set value = excluded.value;
  end if;
end
$$;
