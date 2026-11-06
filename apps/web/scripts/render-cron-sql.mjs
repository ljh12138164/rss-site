import { readdirSync, readFileSync } from 'node:fs'

// Stdout is a private pipe to psql, never a deployment log or artifact.
try {
  const secret = process.env.CRON_SECRET
  if (!secret || /[\r\n\0]/.test(secret)) throw new Error('invalid configuration')
  const root = new URL('../../../', import.meta.url)
  const jobs = JSON.parse(readFileSync(new URL('deploy/server/business-jobs.json', root), 'utf8'))
  const names = new Set()
  for (const job of jobs) {
    if (
      !/^[a-z0-9-]+$/.test(job.source) ||
      names.has(job.source) ||
      typeof job.schedule !== 'string' ||
      !job.path?.startsWith('/cron/')
    )
      throw new Error('invalid configuration')
    names.add(job.source)
  }
  const quote = (value) => `'${value.replaceAll("'", "''")}'`
  const migrations = new URL('deploy/postgres/migrations/', root)
  const migration = readdirSync(migrations)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => readFileSync(new URL(name, migrations), 'utf8'))
    .join('\n')
  process.stdout.write(`
set log_statement='none';
set log_min_error_statement='panic';
set log_error_verbosity='terse';
begin;
${migration}
insert into private.business_cron_settings(singleton,secret) values (true,${quote(secret)})
  on conflict (singleton) do update set secret=excluded.secret;
select private.sync_business_jobs(${quote(JSON.stringify(jobs))}::jsonb);
commit;
`)
} catch {
  console.error('Cron SQL rendering failed; no credentials printed')
  process.exitCode = 1
}
