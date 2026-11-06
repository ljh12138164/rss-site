import { readFile, writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { getSignalSource, type SignalSourceId } from '@rss-site/signals'
import { setupSignalCron } from './cron'

async function main() {
  const { values } = parseArgs({ options: { output: { type: 'string' } } })
  if (!values.output) throw new Error('Pass --output /protected/path/cron-verification.json')
  const apiUrl = process.env.SITE_URL
  const cronSecret = process.env.CRON_SECRET
  if (!apiUrl || !cronSecret) throw new Error('SITE_URL and CRON_SECRET are required')

  const jobs = JSON.parse(
    await readFile(new URL('../../../../deploy/server/business-jobs.json', import.meta.url), 'utf8')
  ) as Array<{ source: string; path: string }>
  const sources = jobs
    .filter((job) => job.path.startsWith('/cron/signals/'))
    .map((job) => {
      const source = getSignalSource(job.source as SignalSourceId)
      if (job.path !== `/cron/signals/${source.id}`) throw new Error('Invalid configured job path')
      return source.id
    })
  const results = await setupSignalCron({
    apiUrl,
    cronSecret,
    sources,
    repository: {
      async verifyIngestion(input) {
        const response = await fetch(new URL(`/cron/verify/${input.source}`, apiUrl), {
          method: 'POST',
          redirect: 'error',
          signal: AbortSignal.timeout(30_000),
          headers: { Authorization: `Bearer ${cronSecret}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ batchId: input.batchId, itemCount: input.itemCount })
        })
        if (!response.ok || (await response.json()).verified !== true)
          throw new Error(`Source ${input.source} failed target database verification`)
      }
    }
  })
  const evidence = {
    database_major: 18,
    old_writers_disabled: false,
    verified_at: new Date().toISOString(),
    verified_jobs: results.map((result) => result.source),
    results
  }
  // Exclusive create: never leave an old successful evidence file masquerading as a new run.
  await writeFile(values.output, `${JSON.stringify(evidence, null, 2)}\n`, {
    flag: 'wx',
    mode: 0o600
  })
  console.log(`Verified ${results.length} sources against PostgreSQL 18; no jobs enabled`)
}

main().catch(() => {
  console.error(
    'Cron verification failed; no enablement evidence was created. Check the Next endpoint and target PostgreSQL configuration'
  )
  process.exitCode = 1
})
