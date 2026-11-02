import type postgres from 'postgres'
import type { CookieRefreshDependencies, CookieState } from './zhihu-cookie.js'

type Sql = ReturnType<typeof postgres>
const secretName = 'zhihu_cookie_refresh_state'

export function vaultCookieLock(sql: Sql): CookieRefreshDependencies['withLock'] {
  return (action) =>
    sql.begin(async (transaction) => {
      const [lock] = await transaction<{ acquired: boolean }[]>`
      select pg_try_advisory_xact_lock(734105981) as acquired
    `
      if (!lock.acquired) return { status: 'busy' as const }
      return action({
        async load() {
          const [row] = await transaction<{ decrypted_secret: string }[]>`
          select decrypted_secret from vault.decrypted_secrets where name = ${secretName}
        `
          return row ? (JSON.parse(row.decrypted_secret) as CookieState) : undefined
        },
        async save(state) {
          // A separate connection commits rotated credentials even if later network steps fail.
          await sql.begin(async (writer) => {
            const [existing] = await writer<{ id: string }[]>`
            select id::text from vault.secrets where name = ${secretName}
          `
            if (existing) {
              await writer`select vault.update_secret(${existing.id}::uuid, ${JSON.stringify(state)})`
            } else {
              await writer`select vault.create_secret(${JSON.stringify(state)}, ${secretName})`
            }
          })
        }
      })
    })
}
