import type { SignalSection, SignalSourceId } from '@rss-site/signals'
import { and, eq, inArray, ne, sql } from 'drizzle-orm'
import type { Database } from '../db/client.js'
import {
  aiEventArticles,
  aiEvents,
  hotItems,
  ingestionRuns,
  signalArticles,
  skillDetails,
  sourceStatus
} from '../db/schema.js'
import { changedSourceKeys } from './content-change.js'
import type { SignalFeedItem } from './feed.js'

export interface SuccessfulIngestion {
  batchId: string
  startedAt: Date
  finishedAt: Date
  items: SignalFeedItem[]
}

export interface FailedIngestion {
  batchId: string
  startedAt: Date
  finishedAt: Date
  errorMessage: string
}

export interface SignalStore {
  replaceRanking(
    input: SuccessfulIngestion
  ): Promise<{ changed: boolean; events: string[]; skills?: string[] } | undefined>
  recordFailure(input: FailedIngestion): Promise<void>
}

export class DrizzleSignalStore implements SignalStore {
  constructor(
    private readonly db: Database,
    private readonly source: SignalSourceId,
    private readonly section: SignalSection
  ) {}

  async replaceRanking(input: SuccessfulIngestion) {
    return this.db.transaction(async (tx) => {
      const previous = await tx
        .select({
          sourceKey: hotItems.sourceKey,
          title: hotItems.title,
          url: hotItems.url,
          summary: hotItems.summary,
          author: hotItems.author,
          publishedAt: hotItems.publishedAt,
          position: hotItems.position,
          imageUrl: hotItems.imageUrl,
          contentHtml: signalArticles.contentHtml
        })
        .from(hotItems)
        .leftJoin(signalArticles, eq(hotItems.articleId, signalArticles.id))
        .where(eq(hotItems.source, this.source))
      const changedKeys = changedSourceKeys(previous, input.items)
      const details = input.items.flatMap((item) => (item.skillDetail ? [item.skillDetail] : []))
      const changedDetails: string[] = []
      if (details.length) {
        const previousDetails = await tx
          .select()
          .from(skillDetails)
          .where(
            inArray(
              skillDetails.skillId,
              details.map((detail) => detail.skillId)
            )
          )
        const previousById = new Map(previousDetails.map((detail) => [detail.skillId, detail]))
        const values = details.map((detail) => {
          const old = previousById.get(detail.skillId)
          const hasBody = Boolean(detail.skillMarkdown && detail.contentHtml)
          if (
            !old ||
            old.skillMarkdown !== (hasBody ? detail.skillMarkdown : old.skillMarkdown) ||
            old.totalInstalls !== (detail.totalInstalls ?? old.totalInstalls) ||
            old.description !== (detail.description ?? old.description) ||
            old.detailState !== detail.detailState ||
            old.name !== detail.name ||
            old.installUrl !== detail.installUrl ||
            old.upstreamUrl !== detail.upstreamUrl
          ) {
            changedDetails.push(detail.skillId)
          }
          return {
            ...detail,
            skillMarkdown: hasBody ? detail.skillMarkdown : null,
            contentHtml: hasBody ? detail.contentHtml : null,
            contentHash: hasBody ? detail.contentHash : null,
            lastSeenAt: input.finishedAt,
            contentSyncedAt: hasBody ? input.finishedAt : null,
            totalInstallsSyncedAt: detail.totalInstalls !== null ? input.finishedAt : null
          }
        })
        await tx
          .insert(skillDetails)
          .values(values)
          .onConflictDoUpdate({
            target: skillDetails.skillId,
            set: {
              name: sql.raw('excluded.name'),
              source: sql.raw('excluded.source'),
              sourceType: sql.raw('excluded.source_type'),
              upstreamUrl: sql.raw('excluded.upstream_url'),
              installUrl: sql.raw('excluded.install_url'),
              detailState: sql.raw('excluded.detail_state'),
              lastSeenAt: input.finishedAt,
              description: sql`coalesce(excluded.description, ${skillDetails.description})`,
              skillMarkdown: sql`coalesce(excluded.skill_markdown, ${skillDetails.skillMarkdown})`,
              contentHtml: sql`coalesce(excluded.content_html, ${skillDetails.contentHtml})`,
              contentHash: sql`case when excluded.skill_markdown is not null then excluded.content_hash else ${skillDetails.contentHash} end`,
              contentSyncedAt: sql`coalesce(excluded.content_synced_at, ${skillDetails.contentSyncedAt})`,
              totalInstalls: sql`coalesce(excluded.total_installs, ${skillDetails.totalInstalls})`,
              totalInstallsSyncedAt: sql`coalesce(excluded.total_installs_synced_at, ${skillDetails.totalInstallsSyncedAt})`
            }
          })
      }
      await tx.insert(ingestionRuns).values({
        id: input.batchId,
        source: this.source,
        status: 'succeeded',
        itemCount: input.items.length,
        startedAt: input.startedAt,
        finishedAt: input.finishedAt
      })

      const articleRows = await tx
        .insert(signalArticles)
        .values(
          input.items.map((item) => ({
            section: this.section,
            source: this.source,
            sourceKey: item.sourceKey,
            title: item.title,
            url: item.url,
            imageUrl: item.imageUrl,
            summary: item.summary,
            contentHtml: item.contentHtml ?? null,
            author: item.author,
            publishedAt: item.publishedAt,
            firstSeenAt: input.finishedAt,
            lastSeenAt: input.finishedAt
          }))
        )
        .onConflictDoUpdate({
          target: [signalArticles.source, signalArticles.sourceKey],
          set: {
            section: sql.raw(`excluded.${signalArticles.section.name}`),
            title: sql.raw(`excluded.${signalArticles.title.name}`),
            url: sql.raw(`excluded.${signalArticles.url.name}`),
            imageUrl: sql.raw(`excluded.${signalArticles.imageUrl.name}`),
            summary: sql.raw(`excluded.${signalArticles.summary.name}`),
            contentHtml: sql`coalesce(excluded.content_html, ${signalArticles.contentHtml})`,
            author: sql.raw(`excluded.${signalArticles.author.name}`),
            publishedAt: sql.raw(`excluded.${signalArticles.publishedAt.name}`),
            lastSeenAt: sql.raw(`excluded.${signalArticles.lastSeenAt.name}`)
          }
        })
        .returning({ id: signalArticles.id, sourceKey: signalArticles.sourceKey })

      const articleIds = new Map(articleRows.map((article) => [article.sourceKey, article.id]))

      await tx
        .insert(hotItems)
        .values(
          input.items.map((item) => ({
            section: this.section,
            source: this.source,
            sourceKey: item.sourceKey,
            articleId: requireArticleId(articleIds, item.sourceKey),
            title: item.title,
            url: item.url,
            imageUrl: item.imageUrl,
            summary: item.summary,
            author: item.author,
            publishedAt: item.publishedAt,
            position: item.position,
            firstSeenAt: input.finishedAt,
            lastSeenAt: input.finishedAt,
            batchId: input.batchId
          }))
        )
        .onConflictDoNothing({ target: [hotItems.source, hotItems.sourceKey] })

      for (const item of input.items) {
        await tx
          .update(hotItems)
          .set({
            articleId: requireArticleId(articleIds, item.sourceKey),
            title: item.title,
            url: item.url,
            imageUrl: item.imageUrl,
            summary: item.summary,
            author: item.author,
            publishedAt: item.publishedAt,
            position: item.position,
            lastSeenAt: input.finishedAt,
            batchId: input.batchId
          })
          .where(and(eq(hotItems.source, this.source), eq(hotItems.sourceKey, item.sourceKey)))
      }

      await tx
        .delete(hotItems)
        .where(and(eq(hotItems.source, this.source), ne(hotItems.batchId, input.batchId)))

      await tx
        .insert(sourceStatus)
        .values({
          source: this.source,
          section: this.section,
          itemCount: input.items.length,
          lastSuccessAt: input.finishedAt,
          lastBatchId: input.batchId
        })
        .onConflictDoUpdate({
          target: sourceStatus.source,
          set: {
            itemCount: input.items.length,
            lastSuccessAt: input.finishedAt,
            lastBatchId: input.batchId
          }
        })
      const events =
        this.section === 'ai' && changedKeys.length
          ? await tx
              .selectDistinct({ slug: aiEvents.slug })
              .from(aiEvents)
              .innerJoin(aiEventArticles, eq(aiEventArticles.eventId, aiEvents.id))
              .innerJoin(signalArticles, eq(aiEventArticles.articleId, signalArticles.id))
              .where(
                and(
                  eq(aiEvents.status, 'published'),
                  eq(signalArticles.source, this.source),
                  inArray(signalArticles.sourceKey, changedKeys)
                )
              )
          : []
      return {
        changed: changedKeys.length > 0 || changedDetails.length > 0,
        events: events.map((event) => event.slug),
        ...(this.section === 'skills'
          ? { skills: [...new Set([...changedKeys, ...changedDetails])] }
          : {})
      }
    })
  }

  async recordFailure(input: FailedIngestion) {
    await this.db.insert(ingestionRuns).values({
      id: input.batchId,
      source: this.source,
      status: 'failed',
      itemCount: 0,
      errorMessage: input.errorMessage,
      startedAt: input.startedAt,
      finishedAt: input.finishedAt
    })
  }
}

function requireArticleId(articleIds: Map<string, string>, sourceKey: string): string {
  const articleId = articleIds.get(sourceKey)
  if (!articleId) throw new Error(`Missing persisted article for source key: ${sourceKey}`)
  return articleId
}
