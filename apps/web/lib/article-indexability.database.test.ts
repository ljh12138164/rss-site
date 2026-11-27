import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

describe.skipIf(!process.env.DAILY_REPORT_TEST_DATABASE_URL)(
  'article indexability SQL function and migration against PostgreSQL 18',
  () => {
    const schema = `idx_test_${randomUUID().replaceAll('-', '')}`
    const url = process.env.DAILY_REPORT_TEST_DATABASE_URL ?? ''
    const admin = postgres(url, {
      prepare: false,
      max: 1,
      connect_timeout: 10
    })

    beforeAll(async () => {
      await admin.unsafe(`create schema ${schema}`)
      await admin.unsafe(
        `create table ${schema}.maintenance_state (name text primary key, value jsonb not null)`
      )
      await admin.unsafe(`create table ${schema}.hot_items (article_id uuid not null)`)
      await admin.unsafe(
        `create table ${schema}.ai_event_articles (event_id uuid not null, article_id uuid not null)`
      )
      await admin.unsafe(
        `create table ${schema}.ai_events (id uuid primary key, updated_at timestamptz not null default now())`
      )

      // Seed the legacy greedy regex function in the isolated test schema so 025 backfill behavior is exercised end-to-end.
      await admin.unsafe(`
        create function ${schema}.article_has_indexable_content(article_title text, article_summary text, article_html text)
        returns boolean language sql immutable parallel safe set search_path = '${schema}' as $_$
          with body as (
            select coalesce(nullif(btrim(article_html), ''), article_summary, '') as html
          ), visible as (
            select regexp_replace(
              regexp_replace(
                regexp_replace(html, '<(script|style|iframe|textarea|audio)\\y[^>]*>.*?</\\1\\s*>', '', 'gis'),
                '<a\\y[^>]*>.*?</a\\s*>', '', 'gis'),
              '</?(p|div|br|li|h[1-6])\\y[^>]*>', E'\\n', 'gi') as html
            from body
          ), plain as (
            select regexp_replace(
              regexp_replace(html, '<[^>]*>', '', 'g'),
              '&(nbsp|#160|#x[aA]0);', ' ', 'g') as text
            from visible
          ), meaningful as (
            select string_agg(line, ' ') as text
            from plain, lateral unnest(string_to_array(text, E'\\n')) as lines(raw_line),
              lateral (select btrim(raw_line, E' \\t\\r　') as line) normalized
            where line !~ '^(记者|编导|编辑|责任编辑|制作|出品|监制|新华社音视频部制作)[：: ]'
              and line <> '新华社音视频部制作'
              and line !~* '^(Comments on Hacker News|Source|Read more|阅读全文|查看原文|求经验分享[！!]?|暂无内容)[[:space:][:punct:]]*$'
          )
          select (
            coalesce(text, '') ~ '[[:alnum:]]'
            and btrim(text) <> btrim(coalesce(article_title, ''))
          )
          from meaningful;
        $_$;
      `)
      await admin.unsafe(`
        create table ${schema}.signal_articles (
          id uuid primary key default gen_random_uuid(),
          section text not null,
          source text not null,
          source_key text not null,
          title text not null,
          url text not null,
          summary text,
          content_html text,
          last_seen_at timestamptz not null default now(),
          content_updated_at timestamptz not null default '2026-11-20T00:00:00Z'::timestamptz,
          is_indexable boolean generated always as (
            octet_length(coalesce(content_html, '')) <= 524288
            and ${schema}.article_has_indexable_content(title, summary, content_html)
          ) stored
        );
      `)
    }, 30_000)

    afterAll(async () => {
      if (!/^idx_test_[a-f0-9]{32}$/.test(schema)) throw new Error('Unsafe test schema')
      await admin.unsafe(`drop schema if exists ${schema} cascade`)
      await admin.end({ timeout: 5 })
    }, 30_000)

    it('keeps multi-link and multi-embed articles indexable while rejecting placeholders in baseline function', async () => {
      const [row] = await admin`
        select
          public.article_has_indexable_content('Multi link', null, '<p>Intro <a href="https://a.test">first</a> body between links <a href="https://b.test">second</a>.</p>') as multi_link,
          public.article_has_indexable_content('Multi embed', null, '<iframe src="https://a.test"></iframe><p>Paragraph between embeds.</p><iframe src="https://b.test"></iframe>') as multi_embed,
          public.article_has_indexable_content('HN item', null, '<a href="https://a.test">Comments on Hacker News</a> | <a href="https://b.test">Source</a>') as hn_stub,
          public.article_has_indexable_content('Share item', null, '<div><button><svg></svg>Share</button></div>') as share_only,
          public.article_has_indexable_content('Share plain', 'Share', null) as share_summary,
          public.article_has_indexable_content('Substack stub', null, '<p><a href="https://a.test">Read more</a></p>') as read_more_link,
          public.article_has_indexable_content('Substack plain', null, '<p>Read more</p>') as read_more_plain,
          public.article_has_indexable_content('Video', null, '<div data-cctv-video="0123456789abcdef0123456789abcdef"></div>') as cctv_video
      `
      expect(row).toEqual({
        multi_link: true,
        multi_embed: true,
        hn_stub: false,
        share_only: false,
        share_summary: false,
        read_more_link: false,
        read_more_plain: false,
        cctv_video: true
      })
    })

    it('recomputes stale generated rows cleanly and replays 025 migration idempotently', async () => {
      const rows = await admin.unsafe(`
        insert into ${schema}.signal_articles(id, section, source, source_key, title, url, summary, content_html)
        values
          ('11111111-1111-4111-8111-111111111111', 'technology', 'vercel', 'multi-a', 'Vercel update', 'https://vercel.com/blog/x', null,
            '<p>Start <a href="https://a.test">first link</a> substantive engineering prose <a href="https://b.test">second link</a> end.</p>'),
          ('22222222-2222-4222-8222-222222222222', 'ai', 'openai', 'share-stub', 'Demo video', 'https://openai.com/business/learn/demo/', null,
            '<div><button><svg></svg>Share</button></div>'),
          ('33333333-3333-4333-8333-333333333333', 'technology', 'hacker-news', 'hn-only', 'HN post', 'https://news.ycombinator.com/item?id=1', null,
            '<a href="https://a.test">Comments on Hacker News</a> | <a href="https://b.test">Source</a>')
        returning source_key, is_indexable, content_updated_at
      `)
      expect(rows.map((r) => [r.source_key, r.is_indexable])).toEqual([
        ['multi-a', false],
        ['share-stub', true],
        ['hn-only', false]
      ])

      await admin.unsafe(
        `insert into ${schema}.hot_items(article_id) values ('22222222-2222-4222-8222-222222222222')`
      )

      const migration = readFileSync(
        new URL(
          '../../../deploy/postgres/migrations/025-fix-article-indexability-regex.sql',
          import.meta.url
        ),
        'utf8'
      )
        .replaceAll('public.', `${schema}.`)
        .replaceAll('private.', `${schema}.`)
        .replaceAll("set search_path to 'public'", `set search_path to '${schema}'`)

      // Replay twice consecutively to mirror verify-release-runtime behavior.
      await admin.unsafe(migration)
      await admin.unsafe(migration)

      const updated = await admin.unsafe(
        `select source_key, is_indexable, content_updated_at from ${schema}.signal_articles order by source_key`
      )
      expect(updated.map((r) => [r.source_key, r.is_indexable])).toEqual([
        ['hn-only', false],
        ['multi-a', true],
        ['share-stub', false]
      ])
      for (const row of updated) {
        expect(new Date(row.content_updated_at as string).toISOString()).toBe(
          '2026-11-20T00:00:00.000Z'
        )
      }
      const [stamp] = await admin.unsafe(
        `select name from ${schema}.maintenance_state where name = 'article_indexability_regex_v2_backfilled'`
      )
      expect(stamp?.name).toBe('article_indexability_regex_v2_backfilled')
    })
  }
)
