module.exports = {
  apps: [
    {
      name: 'rss-site',
      cwd: '/app/apps/web',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '768M',
      exp_backoff_restart_delay: 100,
      kill_timeout: 10000
    }
  ]
}
