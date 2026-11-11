import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { vercelClient } from '../../../server/api/src/maintenance/vercel'
import {
  RefreshError,
  refreshZhihuCookie,
  requestJson,
  zhihuAccount
} from '../../../server/api/src/maintenance/zhihu'
import {
  type CookieState,
  runZhihuCookieRefresh
} from '../../../server/api/src/maintenance/zhihu-cookie'
import { RETENTION_COMMAND } from '../../../server/api/src/setup/cron'
import { getBusinessDatabase } from './business-db'
import { updateContent } from './content-update'

function encryptionKey() {
  const key = Buffer.from(process.env.MAINTENANCE_ENCRYPTION_KEY ?? '', 'base64')
  if (key.length !== 32) throw new Error('maintenance_configuration')
  return key
}
export function encryptCookieState(state: CookieState) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const body = Buffer.concat([cipher.update(JSON.stringify(state), 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64')
}
export function decryptCookieState(encrypted: string): CookieState {
  const buffer = Buffer.from(encrypted, 'base64')
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), buffer.subarray(0, 12))
  decipher.setAuthTag(buffer.subarray(12, 28))
  return JSON.parse(
    Buffer.concat([decipher.update(buffer.subarray(28)), decipher.final()]).toString('utf8')
  ) as CookieState
}

export async function refreshBusinessCookie() {
  const token = process.env.VERCEL_API_TOKEN
  if (!token) throw new RefreshError('missing_vercel_configuration')
  const vercel = vercelClient({
    token,
    projectId: 'prj_IrNy4UhevVBN7Z6Jt56vZ7cCa0oG',
    teamId: 'team_o6xV8kVjRVVZ89JHKt353m3A'
  })
  const client = getBusinessDatabase().client
  return runZhihuCookieRefresh({
    // Existing Vault state must be imported before enabling the new task.
    withLock: (action) =>
      client.begin(async (tx) => {
        const [lock] = await tx`select pg_try_advisory_xact_lock(734105981) as acquired`
        if (!lock.acquired) return { status: 'busy' }
        return action({
          async load() {
            const [row] =
              await tx`select value from private.maintenance_state where name='zhihu_cookie_refresh_state'`
            if (!row) throw new RefreshError('missing_imported_cookie_state')
            return decryptCookieState(row.value.encrypted)
          },
          async save(state) {
            const value = { encrypted: encryptCookieState(state) }
            // Commit separately before network calls: rotated credentials must survive a later failure.
            await client`update private.maintenance_state set value=${JSON.stringify(value)}::jsonb where name='zhihu_cookie_refresh_state'`
          }
        })
      }),
    refresh: refreshZhihuCookie,
    account: zhihuAccount,
    publish: vercel.publish,
    deploymentStatus: vercel.status,
    async verifyRsshub() {
      const url = new URL(
        '/api/zhihu/check-cookie',
        process.env.RSSHUB_BASE_URL ?? 'https://rss.ljhboard.cn'
      )
      if (url.protocol !== 'https:') throw new RefreshError('invalid_rsshub_url')
      const response = await requestJson(fetch, url.href)
      if (((await response.json()) as { code: unknown }).code !== 0)
        throw new RefreshError('rsshub_login_check_failed')
    }
  })
}

export async function retainBusinessData() {
  const client = getBusinessDatabase().client
  return client.begin(async (tx) => {
    const [lock] = await tx`select pg_try_advisory_xact_lock(734105982) as acquired`
    if (!lock.acquired) return { status: 'busy' }
    // Fixed, versioned SQL; never accepts SQL from a request.
    await tx.unsafe(RETENTION_COMMAND)
    await tx`delete from private.hot_ranking_generations where recorded_at < now() - interval '7 days'`
    return { status: 'retained' }
  })
}

export async function drainPublicationOutbox() {
  const client = getBusinessDatabase().client
  return client.begin(async (tx) => {
    const rows =
      await tx`select id,payload from private.publication_outbox where next_attempt_at<=now() order by next_attempt_at for update skip locked limit 5`
    let accepted = 0
    for (const row of rows) {
      const payload = row.payload as { section: string; source: string; id: string; title: string }
      try {
        const result = await updateContent({
          section: `/${payload.section}`,
          source: payload.source,
          publicationId: row.id,
          durablePublication: true,
          article: { id: payload.id, title: payload.title, previousTitle: payload.title }
        })
        if (!result.cacheInvalidated || !result.publicationAccepted)
          throw new Error('publication_unavailable')
        await tx`delete from private.publication_outbox where id=${row.id}`
        accepted++
      } catch {
        await tx`update private.publication_outbox set attempts=attempts+1,next_attempt_at=now()+interval '5 minutes' where id=${row.id}`
      }
    }
    return { processed: rows.length, accepted }
  })
}
