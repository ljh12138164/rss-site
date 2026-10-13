import { type DBSchema, type IDBPDatabase, openDB } from 'idb'
import { type ArticleSummary, isArticleSummary } from './article-summary-result'

interface SummaryDatabase extends DBSchema {
  summaries: {
    key: string
    value: { summary: ArticleSummary; expiresAt: number }
  }
}

let database: Promise<IDBPDatabase<SummaryDatabase>> | undefined

function getDatabase() {
  if (!database) {
    const connection = openDB<SummaryDatabase>('rss-site-ai-summary', 1, {
      upgrade(db) {
        db.createObjectStore('summaries')
      },
      blocking() {
        void connection.then((db) => db.close())
        database = undefined
      },
      terminated() {
        database = undefined
      }
    })
    database = connection.catch((error) => {
      database = undefined
      throw error
    })
  }
  return database
}

export async function readLocalSummary(key: string): Promise<ArticleSummary | null> {
  if (typeof indexedDB === 'undefined') return null
  try {
    const db = await getDatabase()
    const record = await db.get('summaries', key)
    if (!record) return null
    if (
      !Number.isFinite(record.expiresAt) ||
      record.expiresAt <= Date.now() ||
      !isArticleSummary(record.summary)
    ) {
      await db.delete('summaries', key)
      return null
    }
    return record.summary
  } catch {
    return null
  }
}

export async function writeLocalSummary(key: string, summary: ArticleSummary): Promise<void> {
  if (typeof indexedDB === 'undefined' || !isArticleSummary(summary)) return
  try {
    const db = await getDatabase()
    await db.put('summaries', { summary, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 }, key)
  } catch {
    // Browser storage is optional; the generated summary remains usable.
  }
}
