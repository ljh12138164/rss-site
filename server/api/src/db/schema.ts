import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid
} from 'drizzle-orm/pg-core'

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

export const signalArticles = pgTable(
  'signal_articles',
  {
    id: uuid().defaultRandom().primaryKey(),
    section: text().notNull(),
    source: text().notNull(),
    sourceKey: text('source_key').notNull(),
    title: text().notNull(),
    url: text().notNull(),
    imageUrl: text('image_url'),
    summary: text(),
    author: text(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
    isPinned: boolean('is_pinned').default(false).notNull()
  },
  (table) => [
    unique('signal_articles_source_key_unique').on(table.source, table.sourceKey),
    index('signal_articles_section_source_last_seen_idx').on(
      table.section,
      table.source,
      table.lastSeenAt
    ),
    index('signal_articles_retention_idx').on(table.lastSeenAt, table.isPinned)
  ]
)

export const aiEvents = pgTable(
  'ai_events',
  {
    id: uuid().defaultRandom().primaryKey(),
    slug: text().notNull().unique(),
    title: text().notNull(),
    summary: text().notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    status: text().default('draft').notNull(),
    firstPublishedAt: timestamp('first_published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [index('ai_events_status_occurred_at_idx').on(table.status, table.occurredAt)]
)

export const aiEventArticles = pgTable(
  'ai_event_articles',
  {
    eventId: uuid('event_id')
      .notNull()
      .references(() => aiEvents.id, { onDelete: 'cascade' }),
    articleId: uuid('article_id')
      .notNull()
      .references(() => signalArticles.id, { onDelete: 'restrict' }),
    position: integer().default(1).notNull()
  },
  (table) => [
    primaryKey({ columns: [table.eventId, table.articleId] }),
    unique('ai_event_articles_event_position_unique').on(table.eventId, table.position),
    index('ai_event_articles_article_id_idx').on(table.articleId)
  ]
)

export const hotItems = pgTable(
  'hot_items',
  {
    id: uuid().defaultRandom().primaryKey(),
    section: text().notNull(),
    source: text().notNull(),
    sourceKey: text('source_key').notNull(),
    articleId: uuid('article_id')
      .notNull()
      .references(() => signalArticles.id, { onDelete: 'restrict' }),
    title: text().notNull(),
    url: text().notNull(),
    imageUrl: text('image_url'),
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
export type SignalArticleInsert = typeof signalArticles.$inferInsert
export type SourceStatusInsert = typeof sourceStatus.$inferInsert
export type IngestionRunInsert = typeof ingestionRuns.$inferInsert
