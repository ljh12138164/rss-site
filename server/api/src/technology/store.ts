import { and, eq, ne } from 'drizzle-orm'
import type { Database } from '../db/client.js'
import { hotItems, ingestionRuns, sourceStatus } from '../db/schema.js'
import type { FailedIngestion, SignalStore, SuccessfulIngestion } from './ingest.js'
import type { SignalSection, SignalSourceId } from './sources.js'

export class DrizzleSignalStore implements SignalStore {
  constructor(
    private readonly db: Database,
    private readonly source: SignalSourceId,
    private readonly section: SignalSection
  ) {}

  async replaceRanking(input: SuccessfulIngestion) {
    await this.db.transaction(async (tx) => {
      await tx.insert(ingestionRuns).values({
        id: input.batchId,
        source: this.source,
        status: 'succeeded',
        itemCount: input.items.length,
        startedAt: input.startedAt,
        finishedAt: input.finishedAt
      })

      await tx
        .insert(hotItems)
        .values(
          input.items.map((item) => ({
            section: this.section,
            source: this.source,
            sourceKey: item.sourceKey,
            title: item.title,
            url: item.url,
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
            title: item.title,
            url: item.url,
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
