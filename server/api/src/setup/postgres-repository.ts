import type postgres from 'postgres'
import type { CronRepository } from './cron.js'

type Sql = ReturnType<typeof postgres>

export class PostgresCronRepository implements CronRepository {
  constructor(private readonly sql: Sql) {}

  async installExtensions() {
    await this.sql`create extension if not exists pg_cron with schema pg_catalog`
    await this.sql`create extension if not exists pg_net with schema extensions`
  }

  async upsertSecret(name: string, value: string) {
    const [existing] = await this.sql<{ id: string }[]>`
      select id::text
      from vault.secrets
      where name = ${name}
      limit 1
    `

    if (existing) {
      await this.sql`select vault.update_secret(${existing.id}::uuid, ${value})`
      return
    }

    await this.sql`select vault.create_secret(${value}, ${name})`
  }

  async verifyIngestion({
    source,
    section,
    batchId,
    itemCount
  }: Parameters<CronRepository['verifyIngestion']>[0]) {
    const [verification] = await this.sql<
      Array<{
        run_status: string | null
        run_item_count: number | null
        status_batch_id: string | null
        status_section: string | null
        status_item_count: number | null
        stored_item_count: number
        ranked_item_count: number
        persisted_article_count: number
        published_item_count: number
      }>
    >`
      select
        max(run.status) as run_status,
        max(run.item_count)::integer as run_item_count,
        max(source_state.last_batch_id::text) as status_batch_id,
        max(source_state.section) as status_section,
        max(source_state.item_count)::integer as status_item_count,
        count(item.id)::integer as stored_item_count,
        count(item.id) filter (
          where item.section = ${section}
            and item.position > 0
            and length(btrim(item.title)) > 0
            and item.url ~ '^https?://'
        )::integer as ranked_item_count,
        count(article.id) filter (
          where article.section = ${section}
            and article.source = ${source}
            and article.source_key = item.source_key
            and length(btrim(article.title)) > 0
            and article.url ~ '^https?://'
        )::integer as persisted_article_count,
        count(item.id) filter (where item.published_at is not null)::integer as published_item_count
      from public.ingestion_runs as run
      left join public.source_status as source_state
        on source_state.source = run.source
      left join public.hot_items as item
        on item.source = run.source and item.batch_id = run.id
      left join public.signal_articles as article
        on article.id = item.article_id
      where run.id = ${batchId}::uuid and run.source = ${source}
    `

    const matchesBatch =
      verification?.run_status === 'succeeded' &&
      verification.run_item_count === itemCount &&
      verification.status_batch_id === batchId &&
      verification.status_section === section &&
      verification.status_item_count === itemCount &&
      verification.stored_item_count === itemCount &&
      verification.ranked_item_count === itemCount &&
      verification.persisted_article_count === itemCount
    const requiresPublicationTime =
      section === 'social' || section === 'finance' || section === 'games'
    const hasPlausiblePublicationTime =
      !requiresPublicationTime || (verification?.published_item_count ?? 0) > 0

    if (!matchesBatch || !hasPlausiblePublicationTime) {
      throw new Error(`来源 ${source} 云端数据核验失败，未更新 Cron`)
    }
  }

  async schedule(name: string, schedule: string, command: string) {
    await this.sql`select cron.schedule(${name}, ${schedule}, ${command})`
  }

  async unschedule(name: string) {
    await this.sql`
      select cron.unschedule(${name})
      where exists (select 1 from cron.job where jobname = ${name})
    `
  }
}
