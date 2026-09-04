import { index, integer, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'

export const ingestionRuns = pgTable(
  'ingestion_runs',
  {
    id: uuid().defaultRandom().primaryKey(),
    source: text().notNull(),
    status: text().notNull(),
    itemCount: integer('item_count').default(0).notNull(),
    errorMessage: text('error_message'),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    finishedAt: timestamp('finished_at', { withTimezone: true })
  },
  (table) => [index('ingestion_runs_source_started_at_idx').on(table.source, table.startedAt)]
)

export const sourceStatus = pgTable('source_status', {
  source: text().primaryKey(),
  section: text().notNull(),
  itemCount: integer('item_count').notNull(),
  lastSuccessAt: timestamp('last_success_at', { withTimezone: true }).notNull(),
  lastBatchId: uuid('last_batch_id')
    .notNull()
    .references(() => ingestionRuns.id, { onDelete: 'restrict' })
})

export const hotItems = pgTable(
  'hot_items',
  {
    id: uuid().defaultRandom().primaryKey(),
    section: text().notNull(),
    source: text().notNull(),
    sourceKey: text('source_key').notNull(),
    title: text().notNull(),
    url: text().notNull(),
    summary: text(),
    author: text(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    position: integer().notNull(),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => ingestionRuns.id, { onDelete: 'restrict' })
  },
  (table) => [
    unique('hot_items_source_key_unique').on(table.source, table.sourceKey),
    index('hot_items_section_source_position_idx').on(table.section, table.source, table.position)
  ]
)

export type HotItemInsert = typeof hotItems.$inferInsert
export type SourceStatusInsert = typeof sourceStatus.$inferInsert
export type IngestionRunInsert = typeof ingestionRuns.$inferInsert
