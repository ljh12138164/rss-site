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
    stdout.write('正在配置 Supabase Vault、三十六路错峰采集和历史清理…\n')
    const results = await setupSignalCron({
      apiUrl,
      cronSecret,
      webUrl: process.env.WEB_APP_URL,
      revalidateSecret: process.env.REVALIDATE_SECRET,
      repository: new PostgresCronRepository(sql)
    })

    const itemCount = results.reduce((total, result) => total + result.itemCount, 0)
    stdout.write(
      `配置成功，${results.length} 个来源均已通过云端写入验证并错峰调度；共写入 ${itemCount} 条热点。\n`
    )
  } finally {
    await sql.end()
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : '配置失败')
  process.exitCode = 1
})
