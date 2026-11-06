--
-- PostgreSQL database dump
--



-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: private; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA private;


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: preserve_editorial_article(); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.preserve_editorial_article() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
begin
  if old.editorial_locked and coalesce(current_setting('app.article_admin',true),'') <> 'true' then
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


--
-- Name: preserve_editorial_hot_item(); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.preserve_editorial_hot_item() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
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


--
-- Name: sync_article_ai_event(); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.sync_article_ai_event() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
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


--
-- Name: sync_edited_hot_item(); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.sync_edited_hot_item() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
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


--
-- Name: track_article_content(); Type: FUNCTION; Schema: private; Owner: -
--

CREATE FUNCTION private.track_article_content() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
begin
  if tg_op = 'DELETE' then
    insert into public.content_tombstones(kind, key) values ('news', old.source || '/' || old.id::text)
      on conflict (kind, key) do update set removed_at = now();
    return old;
  end if;
  if row(new.title, new.url, new.summary, new.content_html, new.author, new.published_at)
    is distinct from row(old.title, old.url, old.summary, old.content_html, old.author, old.published_at) then
    new.content_updated_at := now();
    update public.ai_events set updated_at = now()
      where id in (select event_id from public.ai_event_articles where article_id = old.id);
  else
    new.content_updated_at := old.content_updated_at;
  end if;
  return new;
end;
$$;


--
-- Name: article_has_indexable_content(text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.article_has_indexable_content(article_title text, article_summary text, article_html text) RETURNS boolean
    LANGUAGE sql IMMUTABLE PARALLEL SAFE
    SET search_path TO 'public'
    AS $_$
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
$_$;


--
-- Name: get_ingestion_health(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_ingestion_health() RETURNS TABLE(source text, last_success_at timestamp with time zone, last_item_count integer, last_run_at timestamp with time zone, last_run_status text, consecutive_failures bigint, sample_count bigint, body_count bigint)
    LANGUAGE plpgsql STABLE
    SET search_path TO ''
    AS $$
begin
  return query
  with latest as (
    select distinct on (r.source) r.source, r.started_at, r.status
    from public.ingestion_runs r
    order by r.source, r.started_at desc, r.id desc
  ), completed as (
    select r.source, r.status,
      sum((r.status = 'succeeded')::integer) over (
        partition by r.source order by r.started_at desc, r.id desc
        rows between unbounded preceding and current row
      ) as successes
    from public.ingestion_runs r
    where r.status in ('succeeded', 'failed')
  ), streaks as (
    select r.source, count(*) filter (where r.status = 'failed' and r.successes = 0) as failures
    from completed r group by r.source
  ), source_ids as (
    select s.source from public.source_status s
    union select r.source from latest r
  )
  select ids.source, s.last_success_at, coalesce(s.item_count, 0), l.started_at, l.status,
    coalesce(st.failures, 0), quality.total, quality.bodies
  from source_ids ids
  left join public.source_status s on s.source = ids.source
  left join latest l on l.source = ids.source
  left join streaks st on st.source = ids.source
  cross join lateral (
    select count(*) as total, count(*) filter (
      where btrim(regexp_replace(coalesce(a.content_html, ''), '<[^>]*>|&nbsp;|&#160;', '', 'g')) <> ''
        or a.content_html like '%data-cctv-video%'
    ) as bodies
    from (
      select a.content_html from public.signal_articles a
      where a.source = ids.source
      order by a.last_seen_at desc, a.id desc limit 100
    ) a
  ) quality
  order by ids.source;
end;
$$;


--
-- Name: touch_linked_event(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.touch_linked_event() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
begin
  if tg_op <> 'INSERT' then
    update public.ai_events set updated_at = now() where id = old.event_id;
  end if;
  if tg_op <> 'DELETE' then
    update public.ai_events set updated_at = now() where id = new.event_id;
  end if;
  return null;
end;
$$;


--
-- Name: track_event_content(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.track_event_content() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
begin
  if tg_op = 'DELETE' then
    if old.first_published_at is not null then
      insert into public.content_tombstones(kind, key) values ('event', old.slug)
        on conflict (kind, key) do update set removed_at = now();
    end if;
    return old;
  end if;
  if tg_op = 'UPDATE' then
    if new.slug is distinct from old.slug then
      raise exception 'Event slug is immutable';
    end if;
    if old.first_published_at is not null and new.first_published_at is distinct from old.first_published_at then
      raise exception 'First publication time is immutable';
    end if;
    if row(new.title, new.summary, new.occurred_at, new.status)
      is distinct from row(old.title, old.summary, old.occurred_at, old.status) then
      new.updated_at := now();
    end if;
  end if;
  if new.status = 'archived' then
    insert into public.content_tombstones(kind, key) values ('event', new.slug)
      on conflict (kind, key) do update set removed_at = now();
  elsif new.status = 'published' then
    delete from public.content_tombstones where kind = 'event' and key = new.slug;
  end if;
  return new;
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--

CREATE TABLE private.publication_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payload jsonb NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX publication_outbox_due_idx ON private.publication_outbox(next_attempt_at);
CREATE TABLE private.maintenance_state (name text PRIMARY KEY, value jsonb NOT NULL);
CREATE FUNCTION public.notify_deleted_articles() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO private.publication_outbox(payload)
    SELECT jsonb_build_object('section',section,'source',source,'id',id,'title',title)
    FROM deleted_articles;
  RETURN NULL;
END;
$$;

-- Name: ai_event_articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_event_articles (
    event_id uuid NOT NULL,
    article_id uuid NOT NULL,
    "position" integer DEFAULT 1 NOT NULL,
    CONSTRAINT ai_event_articles_position_check CHECK (("position" > 0))
);


--
-- Name: ai_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    summary text NOT NULL,
    occurred_at timestamp with time zone NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    first_published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    auto_article_id uuid,
    CONSTRAINT ai_events_published_at_check CHECK ((((status = 'draft'::text) AND (first_published_at IS NULL)) OR ((status = ANY (ARRAY['published'::text, 'archived'::text])) AND (first_published_at IS NOT NULL)))),
    CONSTRAINT ai_events_slug_check CHECK ((slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::text)),
    CONSTRAINT ai_events_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text]))),
    CONSTRAINT ai_events_summary_check CHECK ((length(btrim(summary)) > 0)),
    CONSTRAINT ai_events_title_check CHECK ((length(btrim(title)) > 0)),
    CONSTRAINT ai_events_updated_at_check CHECK ((updated_at >= created_at))
);


--
-- Name: ai_leaderboard_ranks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_leaderboard_ranks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    model_slug text NOT NULL,
    category text NOT NULL,
    rank integer NOT NULL,
    score text NOT NULL,
    percentile text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_model_evidences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_model_evidences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    model_slug text NOT NULL,
    source_key text NOT NULL,
    benchmark_name text NOT NULL,
    evaluator text NOT NULL,
    domain text NOT NULL,
    raw_score text,
    capability_score text,
    reasoning_tier text,
    measured boolean DEFAULT true NOT NULL,
    source_url text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_model_prices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_model_prices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    model_slug text NOT NULL,
    currency text DEFAULT 'CNY'::text NOT NULL,
    input_price_per_million text,
    output_price_per_million text,
    cached_input_price_per_million text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_models (
    slug text NOT NULL,
    name text NOT NULL,
    creator text NOT NULL,
    description text,
    official_url text,
    overall_score text,
    released_at timestamp with time zone,
    first_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: content_tombstones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_tombstones (
    kind text NOT NULL,
    key text NOT NULL,
    removed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT content_tombstones_kind_check CHECK ((kind = ANY (ARRAY['news'::text, 'event'::text])))
);


--
-- Name: daily_report_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_report_jobs (
    report_date date NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    status text DEFAULT 'queued'::text NOT NULL,
    trigger_kind text DEFAULT 'manual'::text NOT NULL,
    attempt_count integer DEFAULT 0 NOT NULL,
    attempt_limit integer DEFAULT 3 NOT NULL,
    next_attempt_at timestamp with time zone DEFAULT now() NOT NULL,
    run_token uuid,
    lease_until timestamp with time zone,
    window_start timestamp with time zone NOT NULL,
    window_end timestamp with time zone NOT NULL,
    snapshot_at timestamp with time zone,
    input_snapshot jsonb,
    input_hash text,
    prompt_snapshot text,
    selection_version text DEFAULT 'bounded-v1'::text NOT NULL,
    prompt_version text,
    schema_version integer DEFAULT 1 NOT NULL,
    primary_model text DEFAULT 'gemini-3.8-flash'::text NOT NULL,
    fallback_model text DEFAULT '@cf/openai/gpt-oss-120b'::text NOT NULL,
    metrics jsonb,
    last_error_code text,
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    notification_status text DEFAULT 'none'::text NOT NULL,
    notification_attempts integer DEFAULT 0 NOT NULL,
    notification_next_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT daily_report_jobs_attempt_count_check CHECK ((attempt_count >= 0)),
    CONSTRAINT daily_report_jobs_check CHECK (((attempt_limit >= attempt_count) AND (attempt_limit > 0))),
    CONSTRAINT daily_report_jobs_check1 CHECK ((((status = 'running'::text) AND (run_token IS NOT NULL) AND (lease_until IS NOT NULL)) OR ((status <> 'running'::text) AND (run_token IS NULL) AND (lease_until IS NULL)))),
    CONSTRAINT daily_report_jobs_check2 CHECK ((window_end = ((report_date)::timestamp without time zone AT TIME ZONE 'Asia/Shanghai'::text))),
    CONSTRAINT daily_report_jobs_check3 CHECK ((window_start = (window_end - '1 day'::interval))),
    CONSTRAINT daily_report_jobs_check4 CHECK ((((input_snapshot IS NULL) AND (input_hash IS NULL) AND (snapshot_at IS NULL) AND (prompt_snapshot IS NULL)) OR ((input_snapshot IS NOT NULL) AND (input_hash IS NOT NULL) AND (snapshot_at IS NOT NULL) AND (prompt_snapshot IS NOT NULL)))),
    CONSTRAINT daily_report_jobs_check5 CHECK (((notification_status = 'none'::text) OR (status = 'published'::text))),
    CONSTRAINT daily_report_jobs_input_hash_check CHECK (((input_hash IS NULL) OR (input_hash ~ '^[a-f0-9]{64}$'::text))),
    CONSTRAINT daily_report_jobs_input_snapshot_check CHECK (((input_snapshot IS NULL) OR ((jsonb_typeof(input_snapshot) = 'object'::text) AND (octet_length((input_snapshot)::text) <= 262144)))),
    CONSTRAINT daily_report_jobs_metrics_check CHECK (((metrics IS NULL) OR (octet_length((metrics)::text) <= 16384))),
    CONSTRAINT daily_report_jobs_notification_attempts_check CHECK (((notification_attempts >= 0) AND (notification_attempts <= 6))),
    CONSTRAINT daily_report_jobs_notification_status_check CHECK ((notification_status = ANY (ARRAY['none'::text, 'pending'::text, 'accepted'::text, 'failed'::text]))),
    CONSTRAINT daily_report_jobs_report_date_check CHECK ((report_date >= '2000-01-01'::date)),
    CONSTRAINT daily_report_jobs_schema_version_check CHECK ((schema_version = 1)),
    CONSTRAINT daily_report_jobs_status_check CHECK ((status = ANY (ARRAY['queued'::text, 'running'::text, 'retry_wait'::text, 'published'::text, 'failed'::text, 'no_material'::text, 'no_news'::text]))),
    CONSTRAINT daily_report_jobs_trigger_kind_check CHECK ((trigger_kind = ANY (ARRAY['auto'::text, 'manual'::text])))
);


--
-- Name: TABLE daily_report_jobs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.daily_report_jobs IS 'Private durable editorial jobs; prompts, evidence, leases and metrics are never public';


--
-- Name: daily_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_reports (
    report_date date NOT NULL,
    job_id uuid NOT NULL,
    title text NOT NULL,
    content jsonb NOT NULL,
    sources jsonb NOT NULL,
    window_start timestamp with time zone NOT NULL,
    window_end timestamp with time zone NOT NULL,
    input_hash text NOT NULL,
    candidate_count integer NOT NULL,
    story_count integer NOT NULL,
    source_count integer NOT NULL,
    prompt_version text NOT NULL,
    schema_version integer DEFAULT 1 NOT NULL,
    published_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT daily_reports_candidate_count_check CHECK (((candidate_count >= 1) AND (candidate_count <= 48))),
    CONSTRAINT daily_reports_check CHECK ((window_end = ((report_date)::timestamp without time zone AT TIME ZONE 'Asia/Shanghai'::text))),
    CONSTRAINT daily_reports_check1 CHECK ((window_start = (window_end - '1 day'::interval))),
    CONSTRAINT daily_reports_check2 CHECK (((content ? 'stories'::text) AND (jsonb_typeof((content -> 'stories'::text)) = 'array'::text) AND (jsonb_array_length((content -> 'stories'::text)) = story_count))),
    CONSTRAINT daily_reports_content_check CHECK (((jsonb_typeof(content) = 'object'::text) AND (octet_length((content)::text) <= 65536))),
    CONSTRAINT daily_reports_input_hash_check CHECK ((input_hash ~ '^[a-f0-9]{64}$'::text)),
    CONSTRAINT daily_reports_schema_version_check CHECK ((schema_version = 1)),
    CONSTRAINT daily_reports_source_count_check CHECK (((source_count >= 1) AND (source_count <= 36))),
    CONSTRAINT daily_reports_sources_check CHECK (((jsonb_typeof(sources) = 'array'::text) AND ((jsonb_array_length(sources) >= 1) AND (jsonb_array_length(sources) <= 36)) AND (octet_length((sources)::text) <= 131072))),
    CONSTRAINT daily_reports_story_count_check CHECK (((story_count >= 1) AND (story_count <= 12))),
    CONSTRAINT daily_reports_title_check CHECK (((length(title) >= 1) AND (length(title) <= 100)))
);


--
-- Name: TABLE daily_reports; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.daily_reports IS 'Validated immutable daily editions; citations are retained as snapshots without article foreign keys';


--
-- Name: hot_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hot_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    section text NOT NULL,
    source text NOT NULL,
    source_key text NOT NULL,
    title text NOT NULL,
    url text NOT NULL,
    summary text,
    author text,
    published_at timestamp with time zone,
    "position" integer NOT NULL,
    first_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    batch_id uuid NOT NULL,
    image_url text,
    article_id uuid NOT NULL,
    CONSTRAINT hot_items_image_url_check CHECK (((image_url IS NULL) OR (image_url ~ '^https?://'::text))),
    CONSTRAINT hot_items_position_check CHECK (("position" > 0)),
    CONSTRAINT hot_items_source_section_check CHECK ((((section = 'technology'::text) AND (source = ANY (ARRAY['github'::text, 'github-blog'::text, 'cloudflare-blog'::text, 'hacker-news'::text, 'juejin'::text, 'ithome'::text, '36kr'::text, 'geekpark'::text, 'nvidia'::text, 'amd'::text, 'the-decoder'::text]))) OR ((section = 'news'::text) AND (source = ANY (ARRAY['xinhua'::text, 'cctv'::text, 'chinanews'::text, 'thepaper'::text, 'jiemian'::text, 'baidu'::text]))) OR ((section = 'ai'::text) AND (source = ANY (ARRAY['openai'::text, 'chatgpt'::text, 'anthropic'::text, 'deepseek'::text, 'glm'::text, 'google-ai'::text, 'antigravity'::text, 'qwen'::text, 'lilian-weng'::text, 'simon-willison'::text]))) OR ((section = 'social'::text) AND (source = ANY (ARRAY['bilibili'::text, 'zhihu'::text, 'coolapk'::text, 'hupu'::text, 'sspai'::text, 'toutiao'::text]))) OR ((section = 'finance'::text) AND (source = ANY (ARRAY['wallstreetcn'::text, 'cls'::text, 'jin10'::text, 'yicai'::text, 'stcn'::text]))) OR ((section = 'games'::text) AND (source = ANY (ARRAY['3dmgame'::text, 'gcores'::text, 'gamersky'::text, 'ali213'::text, 'indienova'::text, 'chuapp'::text]))) OR ((section = 'skills'::text) AND (source = ANY (ARRAY['skills-all-time'::text, 'skills-trending'::text]))))),
    CONSTRAINT hot_items_title_check CHECK ((length(btrim(title)) > 0)),
    CONSTRAINT hot_items_url_check CHECK ((url ~ '^https?://'::text))
);


--
-- Name: ingestion_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ingestion_runs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source text NOT NULL,
    status text NOT NULL,
    item_count integer DEFAULT 0 NOT NULL,
    error_message text,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    finished_at timestamp with time zone,
    CONSTRAINT ingestion_runs_finished_state CHECK ((((status = 'running'::text) AND (finished_at IS NULL)) OR ((status = ANY (ARRAY['succeeded'::text, 'failed'::text])) AND (finished_at IS NOT NULL)))),
    CONSTRAINT ingestion_runs_item_count_check CHECK ((item_count >= 0)),
    CONSTRAINT ingestion_runs_source_check CHECK ((source = ANY (ARRAY['github'::text, 'github-blog'::text, 'cloudflare-blog'::text, 'hacker-news'::text, 'juejin'::text, 'ithome'::text, '36kr'::text, 'geekpark'::text, 'nvidia'::text, 'amd'::text, 'the-decoder'::text, 'xinhua'::text, 'cctv'::text, 'chinanews'::text, 'thepaper'::text, 'jiemian'::text, 'baidu'::text, 'openai'::text, 'chatgpt'::text, 'anthropic'::text, 'deepseek'::text, 'glm'::text, 'google-ai'::text, 'antigravity'::text, 'qwen'::text, 'lilian-weng'::text, 'simon-willison'::text, 'bilibili'::text, 'zhihu'::text, 'coolapk'::text, 'hupu'::text, 'sspai'::text, 'toutiao'::text, 'wallstreetcn'::text, 'cls'::text, 'jin10'::text, 'yicai'::text, 'stcn'::text, '3dmgame'::text, 'gcores'::text, 'gamersky'::text, 'ali213'::text, 'indienova'::text, 'chuapp'::text, 'skills-all-time'::text, 'skills-trending'::text]))),
    CONSTRAINT ingestion_runs_status_check CHECK ((status = ANY (ARRAY['running'::text, 'succeeded'::text, 'failed'::text])))
);


--
-- Name: signal_articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.signal_articles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    section text NOT NULL,
    source text NOT NULL,
    source_key text NOT NULL,
    title text NOT NULL,
    url text NOT NULL,
    image_url text,
    summary text,
    author text,
    published_at timestamp with time zone,
    first_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    is_pinned boolean DEFAULT false NOT NULL,
    content_updated_at timestamp with time zone DEFAULT now() NOT NULL,
    content_html text,
    editorial_locked boolean DEFAULT false NOT NULL,
    is_indexable boolean GENERATED ALWAYS AS (((octet_length(COALESCE(content_html, ''::text)) <= 524288) AND public.article_has_indexable_content(title, summary, content_html))) STORED,
    CONSTRAINT signal_articles_content_html_check CHECK (((content_html IS NULL) OR (octet_length(content_html) <= 524288))),
    CONSTRAINT signal_articles_image_url_check CHECK (((image_url IS NULL) OR (image_url ~ '^https?://'::text))),
    CONSTRAINT signal_articles_seen_at_check CHECK ((last_seen_at >= first_seen_at)),
    CONSTRAINT signal_articles_source_section_check CHECK ((((section = 'technology'::text) AND (source = ANY (ARRAY['github'::text, 'github-blog'::text, 'cloudflare-blog'::text, 'hacker-news'::text, 'juejin'::text, 'ithome'::text, '36kr'::text, 'geekpark'::text, 'nvidia'::text, 'amd'::text, 'the-decoder'::text]))) OR ((section = 'news'::text) AND (source = ANY (ARRAY['xinhua'::text, 'cctv'::text, 'chinanews'::text, 'thepaper'::text, 'jiemian'::text, 'baidu'::text]))) OR ((section = 'ai'::text) AND (source = ANY (ARRAY['openai'::text, 'chatgpt'::text, 'anthropic'::text, 'deepseek'::text, 'glm'::text, 'google-ai'::text, 'antigravity'::text, 'qwen'::text, 'lilian-weng'::text, 'simon-willison'::text]))) OR ((section = 'social'::text) AND (source = ANY (ARRAY['bilibili'::text, 'zhihu'::text, 'coolapk'::text, 'hupu'::text, 'sspai'::text, 'toutiao'::text]))) OR ((section = 'finance'::text) AND (source = ANY (ARRAY['wallstreetcn'::text, 'cls'::text, 'jin10'::text, 'yicai'::text, 'stcn'::text]))) OR ((section = 'games'::text) AND (source = ANY (ARRAY['3dmgame'::text, 'gcores'::text, 'gamersky'::text, 'ali213'::text, 'indienova'::text, 'chuapp'::text]))) OR ((section = 'skills'::text) AND (source = ANY (ARRAY['skills-all-time'::text, 'skills-trending'::text]))))),
    CONSTRAINT signal_articles_title_check CHECK ((length(btrim(title)) > 0)),
    CONSTRAINT signal_articles_url_check CHECK ((url ~ '^https?://'::text))
);


--
-- Name: COLUMN signal_articles.is_indexable; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.signal_articles.is_indexable IS 'Definite placeholder filter for robots and sitemap; not a ranking or originality score.';


--
-- Name: skill_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skill_details (
    skill_id text NOT NULL,
    name text NOT NULL,
    source text NOT NULL,
    source_type text NOT NULL,
    upstream_url text NOT NULL,
    install_url text,
    description text,
    skill_markdown text,
    content_html text,
    total_installs integer,
    content_hash text,
    detail_state text NOT NULL,
    first_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    content_synced_at timestamp with time zone,
    total_installs_synced_at timestamp with time zone,
    CONSTRAINT skill_details_detail_state_check CHECK ((detail_state = ANY (ARRAY['ready'::text, 'missing'::text, 'error'::text, 'oversize'::text]))),
    CONSTRAINT skill_details_source_type_check CHECK ((source_type = ANY (ARRAY['github'::text, 'well-known'::text]))),
    CONSTRAINT skill_details_total_installs_check CHECK ((total_installs >= 0))
);


--
-- Name: source_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.source_status (
    source text NOT NULL,
    section text NOT NULL,
    item_count integer NOT NULL,
    last_success_at timestamp with time zone NOT NULL,
    last_batch_id uuid NOT NULL,
    CONSTRAINT source_status_item_count_check CHECK ((item_count >= 0)),
    CONSTRAINT source_status_source_section_check CHECK ((((section = 'technology'::text) AND (source = ANY (ARRAY['github'::text, 'github-blog'::text, 'cloudflare-blog'::text, 'hacker-news'::text, 'juejin'::text, 'ithome'::text, '36kr'::text, 'geekpark'::text, 'nvidia'::text, 'amd'::text, 'the-decoder'::text]))) OR ((section = 'news'::text) AND (source = ANY (ARRAY['xinhua'::text, 'cctv'::text, 'chinanews'::text, 'thepaper'::text, 'jiemian'::text, 'baidu'::text]))) OR ((section = 'ai'::text) AND (source = ANY (ARRAY['openai'::text, 'chatgpt'::text, 'anthropic'::text, 'deepseek'::text, 'glm'::text, 'google-ai'::text, 'antigravity'::text, 'qwen'::text, 'lilian-weng'::text, 'simon-willison'::text]))) OR ((section = 'social'::text) AND (source = ANY (ARRAY['bilibili'::text, 'zhihu'::text, 'coolapk'::text, 'hupu'::text, 'sspai'::text, 'toutiao'::text]))) OR ((section = 'finance'::text) AND (source = ANY (ARRAY['wallstreetcn'::text, 'cls'::text, 'jin10'::text, 'yicai'::text, 'stcn'::text]))) OR ((section = 'games'::text) AND (source = ANY (ARRAY['3dmgame'::text, 'gcores'::text, 'gamersky'::text, 'ali213'::text, 'indienova'::text, 'chuapp'::text]))) OR ((section = 'skills'::text) AND (source = ANY (ARRAY['skills-all-time'::text, 'skills-trending'::text])))))
);


--
-- Name: ai_event_articles ai_event_articles_event_position_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_event_articles
    ADD CONSTRAINT ai_event_articles_event_position_unique UNIQUE (event_id, "position");


--
-- Name: ai_event_articles ai_event_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_event_articles
    ADD CONSTRAINT ai_event_articles_pkey PRIMARY KEY (event_id, article_id);


--
-- Name: ai_events ai_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_events
    ADD CONSTRAINT ai_events_pkey PRIMARY KEY (id);


--
-- Name: ai_events ai_events_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_events
    ADD CONSTRAINT ai_events_slug_key UNIQUE (slug);


--
-- Name: ai_leaderboard_ranks ai_leaderboard_ranks_category_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_leaderboard_ranks
    ADD CONSTRAINT ai_leaderboard_ranks_category_slug_unique UNIQUE (category, model_slug);


--
-- Name: ai_leaderboard_ranks ai_leaderboard_ranks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_leaderboard_ranks
    ADD CONSTRAINT ai_leaderboard_ranks_pkey PRIMARY KEY (id);


--
-- Name: ai_model_evidences ai_model_evidences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_model_evidences
    ADD CONSTRAINT ai_model_evidences_pkey PRIMARY KEY (id);


--
-- Name: ai_model_prices ai_model_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_model_prices
    ADD CONSTRAINT ai_model_prices_pkey PRIMARY KEY (id);


--
-- Name: ai_models ai_models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_models
    ADD CONSTRAINT ai_models_pkey PRIMARY KEY (slug);


--
-- Name: content_tombstones content_tombstones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_tombstones
    ADD CONSTRAINT content_tombstones_pkey PRIMARY KEY (kind, key);


--
-- Name: daily_report_jobs daily_report_jobs_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_report_jobs
    ADD CONSTRAINT daily_report_jobs_id_key UNIQUE (id);


--
-- Name: daily_report_jobs daily_report_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_report_jobs
    ADD CONSTRAINT daily_report_jobs_pkey PRIMARY KEY (report_date);


--
-- Name: daily_reports daily_reports_job_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_reports
    ADD CONSTRAINT daily_reports_job_id_key UNIQUE (job_id);


--
-- Name: daily_reports daily_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_reports
    ADD CONSTRAINT daily_reports_pkey PRIMARY KEY (report_date);


--
-- Name: hot_items hot_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hot_items
    ADD CONSTRAINT hot_items_pkey PRIMARY KEY (id);


--
-- Name: hot_items hot_items_source_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hot_items
    ADD CONSTRAINT hot_items_source_key_unique UNIQUE (source, source_key);


--
-- Name: ingestion_runs ingestion_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ingestion_runs
    ADD CONSTRAINT ingestion_runs_pkey PRIMARY KEY (id);


--
-- Name: signal_articles signal_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signal_articles
    ADD CONSTRAINT signal_articles_pkey PRIMARY KEY (id);


--
-- Name: signal_articles signal_articles_source_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signal_articles
    ADD CONSTRAINT signal_articles_source_key_unique UNIQUE (source, source_key);


--
-- Name: skill_details skill_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skill_details
    ADD CONSTRAINT skill_details_pkey PRIMARY KEY (skill_id);


--
-- Name: source_status source_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.source_status
    ADD CONSTRAINT source_status_pkey PRIMARY KEY (source);


--
-- Name: ai_event_articles_article_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_event_articles_article_id_idx ON public.ai_event_articles USING btree (article_id);


--
-- Name: ai_events_auto_article_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ai_events_auto_article_unique ON public.ai_events USING btree (auto_article_id);


--
-- Name: ai_events_status_occurred_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_events_status_occurred_at_idx ON public.ai_events USING btree (status, occurred_at DESC);


--
-- Name: ai_events_timeline_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_events_timeline_idx ON public.ai_events USING btree (occurred_at DESC, id) WHERE (status = 'published'::text);


--
-- Name: ai_leaderboard_ranks_category_rank_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_leaderboard_ranks_category_rank_idx ON public.ai_leaderboard_ranks USING btree (category, rank);


--
-- Name: ai_model_evidences_model_domain_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_model_evidences_model_domain_idx ON public.ai_model_evidences USING btree (model_slug, domain);


--
-- Name: ai_model_prices_model_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_model_prices_model_slug_idx ON public.ai_model_prices USING btree (model_slug);


--
-- Name: ai_models_creator_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_models_creator_idx ON public.ai_models USING btree (creator);


--
-- Name: ai_models_last_seen_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_models_last_seen_idx ON public.ai_models USING btree (last_seen_at);


--
-- Name: daily_report_jobs_notification_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX daily_report_jobs_notification_idx ON public.daily_report_jobs USING btree (notification_next_at) WHERE ((status = 'published'::text) AND (notification_status = 'pending'::text));


--
-- Name: daily_report_jobs_ready_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX daily_report_jobs_ready_idx ON public.daily_report_jobs USING btree (next_attempt_at, report_date) WHERE (status = ANY (ARRAY['queued'::text, 'retry_wait'::text, 'running'::text]));


--
-- Name: hot_items_article_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hot_items_article_id_idx ON public.hot_items USING btree (article_id);


--
-- Name: hot_items_section_source_position_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hot_items_section_source_position_idx ON public.hot_items USING btree (section, source, "position");


--
-- Name: ingestion_runs_source_started_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ingestion_runs_source_started_at_idx ON public.ingestion_runs USING btree (source, started_at DESC);


--
-- Name: signal_articles_indexable_published_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX signal_articles_indexable_published_idx ON public.signal_articles USING btree (published_at DESC NULLS LAST, id DESC) WHERE is_indexable;


--
-- Name: signal_articles_retention_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX signal_articles_retention_idx ON public.signal_articles USING btree (last_seen_at, is_pinned);


--
-- Name: signal_articles_section_source_last_seen_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX signal_articles_section_source_last_seen_idx ON public.signal_articles USING btree (section, source, last_seen_at);


--
-- Name: skill_details_source_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX skill_details_source_idx ON public.skill_details USING btree (source);


--
-- Name: signal_articles article_00_preserve_editorial; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER article_00_preserve_editorial BEFORE UPDATE ON public.signal_articles FOR EACH ROW EXECUTE FUNCTION private.preserve_editorial_article();


--
-- Name: signal_articles article_auto_ai_event; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER article_auto_ai_event AFTER INSERT OR UPDATE OF title, summary, published_at, section, source ON public.signal_articles FOR EACH ROW EXECUTE FUNCTION private.sync_article_ai_event();


--
-- Name: signal_articles article_content_lifecycle; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER article_content_lifecycle BEFORE DELETE OR UPDATE ON public.signal_articles FOR EACH ROW EXECUTE FUNCTION private.track_article_content();


--
-- Name: signal_articles article_editorial_hot_item; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER article_editorial_hot_item AFTER UPDATE ON public.signal_articles FOR EACH ROW EXECUTE FUNCTION private.sync_edited_hot_item();


--
-- Name: signal_articles articles_deleted_publication; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER articles_deleted_publication AFTER DELETE ON public.signal_articles REFERENCING OLD TABLE AS deleted_articles FOR EACH STATEMENT EXECUTE FUNCTION public.notify_deleted_articles();


--
-- Name: ai_events event_content_lifecycle; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER event_content_lifecycle BEFORE INSERT OR DELETE OR UPDATE ON public.ai_events FOR EACH ROW EXECUTE FUNCTION public.track_event_content();


--
-- Name: ai_event_articles event_links_changed; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER event_links_changed AFTER INSERT OR DELETE OR UPDATE ON public.ai_event_articles FOR EACH ROW EXECUTE FUNCTION public.touch_linked_event();


--
-- Name: hot_items hot_item_editorial_values; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER hot_item_editorial_values BEFORE INSERT OR UPDATE ON public.hot_items FOR EACH ROW EXECUTE FUNCTION private.preserve_editorial_hot_item();


--
-- Name: ai_event_articles ai_event_articles_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_event_articles
    ADD CONSTRAINT ai_event_articles_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.signal_articles(id) ON DELETE RESTRICT;


--
-- Name: ai_event_articles ai_event_articles_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_event_articles
    ADD CONSTRAINT ai_event_articles_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.ai_events(id) ON DELETE CASCADE;


--
-- Name: ai_events ai_events_auto_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_events
    ADD CONSTRAINT ai_events_auto_article_id_fkey FOREIGN KEY (auto_article_id) REFERENCES public.signal_articles(id) ON DELETE RESTRICT;


--
-- Name: ai_leaderboard_ranks ai_leaderboard_ranks_model_slug_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_leaderboard_ranks
    ADD CONSTRAINT ai_leaderboard_ranks_model_slug_fkey FOREIGN KEY (model_slug) REFERENCES public.ai_models(slug) ON DELETE CASCADE;


--
-- Name: ai_model_evidences ai_model_evidences_model_slug_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_model_evidences
    ADD CONSTRAINT ai_model_evidences_model_slug_fkey FOREIGN KEY (model_slug) REFERENCES public.ai_models(slug) ON DELETE CASCADE;


--
-- Name: ai_model_prices ai_model_prices_model_slug_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_model_prices
    ADD CONSTRAINT ai_model_prices_model_slug_fkey FOREIGN KEY (model_slug) REFERENCES public.ai_models(slug) ON DELETE CASCADE;


--
-- Name: daily_reports daily_reports_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_reports
    ADD CONSTRAINT daily_reports_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.daily_report_jobs(id);


--
-- Name: daily_reports daily_reports_report_date_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_reports
    ADD CONSTRAINT daily_reports_report_date_fkey FOREIGN KEY (report_date) REFERENCES public.daily_report_jobs(report_date);


--
-- Name: hot_items hot_items_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hot_items
    ADD CONSTRAINT hot_items_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.signal_articles(id) ON DELETE RESTRICT;


--
-- Name: hot_items hot_items_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hot_items
    ADD CONSTRAINT hot_items_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.ingestion_runs(id) ON DELETE RESTRICT;


--
-- Name: source_status source_status_last_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.source_status
    ADD CONSTRAINT source_status_last_batch_id_fkey FOREIGN KEY (last_batch_id) REFERENCES public.ingestion_runs(id) ON DELETE RESTRICT;



REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA public,private FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public,private FROM PUBLIC;
