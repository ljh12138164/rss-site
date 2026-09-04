import type postgres from 'postgres'
import type { CronRepository } from './cron'

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

  async schedule(name: string, schedule: string, command: string) {
    await this.sql`select cron.schedule(${name}, ${schedule}, ${command})`
  }
}
