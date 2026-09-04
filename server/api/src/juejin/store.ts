import { and, eq, ne } from 'drizzle-orm'
import type { Database } from '../db/client'
import { hotItems, ingestionRuns, sourceStatus } from '../db/schema'
import type { FailedIngestion, JuejinStore, SuccessfulIngestion } from './ingest'

const SOURCE = 'juejin'
const SECTION = 'technology'

export class DrizzleJuejinStore implements JuejinStore {
  constructor(private readonly db: Database) {}

  async replaceRanking(input: SuccessfulIngestion) {
    await this.db.transaction(async (tx) => {
      await tx.insert(ingestionRuns).values({
        id: input.batchId,
        source: SOURCE,
        status: 'succeeded',
        itemCount: input.items.length,
        startedAt: input.startedAt,
        finishedAt: input.finishedAt
      })

      await tx
        .insert(hotItems)
        .values(
          input.items.map((item) => ({
            section: SECTION,
            source: SOURCE,
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
          .where(and(eq(hotItems.source, SOURCE), eq(hotItems.sourceKey, item.sourceKey)))
      }

      await tx
        .delete(hotItems)
        .where(and(eq(hotItems.source, SOURCE), ne(hotItems.batchId, input.batchId)))

      await tx
        .insert(sourceStatus)
        .values({
          source: SOURCE,
          section: SECTION,
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
      source: SOURCE,
      status: 'failed',
      itemCount: 0,
      errorMessage: input.errorMessage,
      startedAt: input.startedAt,
      finishedAt: input.finishedAt
    })
  }
}
