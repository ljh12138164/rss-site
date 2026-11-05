import { sql } from 'drizzle-orm'
import { getBusinessDatabase, readBusinessRows } from './business-db'
import type { IngestionHealth } from './ingestion-health'

export type AdminArticle = {
  id: string
  section: string
  source: string
  title: string
  url: string
  image_url: string | null
  summary: string | null
  content_html: string | null
  author: string | null
  published_at: string | null
  is_pinned: boolean
  editorial_locked: boolean
  first_seen_at: string
}
const fields = sql`id,section,source,title,url,image_url,summary,content_html,
  author,published_at,is_pinned,editorial_locked,first_seen_at`

export function listAdminArticles(page: number, search: string) {
  return readBusinessRows<AdminArticle>(sql`select ${fields} from signal_articles
    ${search ? sql`where title ilike ${`%${search}%`}` : sql``}
    order by first_seen_at desc,id desc limit 31 offset ${page * 30}`)
}

export async function editAdminArticle(
  id: string,
  input: {
    title: string
    summary: string | null
    contentHtml: string | null
    imageUrl: string | null
    author: string | null
    publishedAt: string | null
    isPinned: boolean
  }
) {
  return getBusinessDatabase().db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.article_admin','true',true)`)
    const previous = await tx.execute(
      sql`select title from signal_articles where id=${id}::uuid for update`
    )
    if (!previous.length) return null
    const rows = await tx.execute(sql`update signal_articles set title=${input.title},
      summary=${input.summary},content_html=${input.contentHtml},image_url=${input.imageUrl},
      author=${input.author},published_at=${input.publishedAt}::timestamptz,
      is_pinned=${input.isPinned},editorial_locked=true where id=${id}::uuid returning ${fields}`)
    return { previousTitle: String(previous[0].title), article: rows[0] as AdminArticle }
  })
}

export async function readIngestionHealth() {
  const rows = await readBusinessRows<IngestionHealth>(sql`select * from get_ingestion_health()`)
  return rows.map((row) => ({
    ...row,
    consecutive_failures: Number(row.consecutive_failures),
    sample_count: Number(row.sample_count),
    body_count: Number(row.body_count)
  }))
}
