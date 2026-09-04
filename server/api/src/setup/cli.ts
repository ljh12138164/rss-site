import { stdin, stdout } from 'node:process'
import { createInterface } from 'node:readline/promises'
import postgres from 'postgres'
import { normalizeIngestUrl, setupSignalCron } from './cron.js'
import { PostgresCronRepository } from './postgres-repository.js'

function requiredEnvironment(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`缺少 server/api/.env 环境变量：${name}`)
  return value
}

async function main() {
  const databaseUrl = requiredEnvironment('DATABASE_URL')
  const cronSecret = requiredEnvironment('CRON_SECRET')
  const readline = createInterface({ input: stdin, output: stdout })
  let apiUrl: string

  try {
    apiUrl = normalizeIngestUrl(await readline.question('请输入部署后的 Hono API 地址：'))
  } finally {
    readline.close()
  }

  const sql = postgres(databaseUrl, { prepare: false, max: 1, connect_timeout: 10 })
  try {
    stdout.write('正在配置 Supabase Vault、五小时采集和 30 天历史清理…\n')
    const result = await setupSignalCron({
      apiUrl,
      cronSecret,
      repository: new PostgresCronRepository(sql)
    })

    stdout.write(`配置成功，十二个来源已错峰调度；测试采集写入 ${result.itemCount} 条热点。\n`)
  } finally {
    await sql.end()
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : '配置失败')
  process.exitCode = 1
})
