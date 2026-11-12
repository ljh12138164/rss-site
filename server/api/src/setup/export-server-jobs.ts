import { SIGNAL_CRON_JOBS } from '@rss-site/signals'

console.log(
  JSON.stringify(
    [
      ...SIGNAL_CRON_JOBS.map((job) => ({ ...job, path: `/cron/signals/${job.source}` })),
      { source: 'retention', schedule: '30 5 * * *', path: '/cron/maintenance/retention' },
      {
        source: 'hot-ranking-log-retention',
        schedule: '10 * * * *',
        path: '/cron/maintenance/hot-ranking-log-retention'
      },
      { source: 'zhihu-cookie', schedule: '0 20 * * *', path: '/cron/maintenance/zhihu-cookie' },
      {
        source: 'publication-outbox',
        schedule: '*/5 * * * *',
        path: '/cron/maintenance/publication-outbox'
      }
    ],
    null,
    2
  )
)
