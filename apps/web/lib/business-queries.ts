import { sql } from 'drizzle-orm'
import type { AiEvent } from './ai-events'
import { readBusinessRows } from './business-db'
import type { HotItemRow, SourceStatusRow } from './hot-feed'
import type { SignalArticleRow } from './signal-article'

export const readSectionFeed = async (section: string, sources: string[]) => {
  if (!sources.length) return { items: [], statuses: [], error: null }
  const sourceList = sql.join(
    sources.map((id) => sql`${id}`),
    sql`, `
  )
  const [items, statuses] = await Promise.all([
    readBusinessRows<HotItemRow>(sql`select article_id,source,source_key,title,url,image_url,
      summary,author,published_at,position from hot_items
      where section=${section} and source in (${sourceList}) order by position`),
    readBusinessRows<SourceStatusRow>(sql`select source,item_count,last_success_at from source_status
      where source in (${sourceList})`)
  ])
  return { items, statuses, error: null }
}

export async function readArticle(id: string, section: string, source: string) {
  return (
    (
      await readBusinessRows<SignalArticleRow>(sql`select * from signal_articles
    where id=${id}::uuid and section=${section} and source=${source} limit 1`)
    )[0] ?? null
  )
}

export async function readSameSource(source: string) {
  return readBusinessRows<{ id: string; title: string; source: string }>(sql`
    select id,title,source from signal_articles where source=${source} and is_indexable=true
    order by published_at desc nulls last,id limit 5`)
}

const eventFields = sql`id,slug,title,summary,occurred_at,first_published_at,updated_at`
export async function readEvents(after: { id: string; date: string } | null, snapshot: string) {
  return readBusinessRows<AiEvent>(sql`select ${eventFields} from ai_events
    where status='published' and first_published_at<=${snapshot}::timestamptz
    ${
      after
        ? sql`and (occurred_at<${after.date}::timestamptz or
      (occurred_at=${after.date}::timestamptz and id>${after.id}::uuid))`
        : sql``
    }
    order by occurred_at desc,id limit 21`)
}

export async function readEvent(slug: string) {
  return (
    (
      await readBusinessRows<AiEvent>(sql`select ${eventFields} from ai_events
    where slug=${slug} and status='published' limit 1`)
    )[0] ?? null
  )
}

export async function readEventLinks(ids: string[]) {
  if (!ids.length) return []
  return readBusinessRows<{ event_id: string; signal_articles: { source: string } }>(sql`
    select l.event_id,jsonb_build_object('source',a.source) as signal_articles
    from ai_event_articles l join signal_articles a on a.id=l.article_id
    where l.event_id in (${sql.join(
      ids.map((id) => sql`${id}::uuid`),
      sql`, `
    )})
    order by l.position`)
}

export async function readEventSources(id: string) {
  return readBusinessRows<{
    position: number
    signal_articles: {
      id: string
      title: string
      url: string
      source: string
      published_at: string | null
    }
  }>(sql`select l.position,jsonb_build_object('id',a.id,'title',a.title,'url',a.url,
    'source',a.source,'published_at',a.published_at) as signal_articles
    from ai_event_articles l join signal_articles a on a.id=l.article_id
    where l.event_id=${id}::uuid order by l.position`)
}

export async function readRelatedEvents(id: string, articleIds: string[]) {
  if (!articleIds.length) return []
  return readBusinessRows<{
    ai_events: Pick<AiEvent, 'id' | 'slug' | 'title' | 'occurred_at'>
  }>(sql`
    select jsonb_build_object('id',e.id,'slug',e.slug,'title',e.title,'occurred_at',e.occurred_at) as ai_events
    from ai_event_articles l join ai_events e on e.id=l.event_id
    where l.article_id in (${sql.join(
      articleIds.map((value) => sql`${value}::uuid`),
      sql`, `
    )})
      and l.event_id<>${id}::uuid and e.status='published' limit 30`)
}

export async function readContentStatus(
  kind: 'event' | 'news',
  id: string,
  source: string,
  section: string
) {
  const [row] = await readBusinessRows<{ removed: boolean; visible: boolean }>(sql`
    select exists(select 1 from content_tombstones where kind=${kind}
      and key=${kind === 'event' ? id : `${source}/${id}`}) as removed,
    ${
      kind === 'event'
        ? sql`exists(select 1 from ai_events where slug=${id} and status='published')`
        : sql`exists(select 1 from signal_articles where id=${id}::uuid and section=${section} and source=${source})`
    } as visible`)
  return row.removed ? 410 : row.visible ? 200 : 404
}
