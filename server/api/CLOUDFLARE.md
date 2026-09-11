# Cloudflare Workers deployment

`server/api` runs as the `rss-site-api` Worker. Supabase Cron continues to call the existing
`POST /cron/signals/:source` endpoints; the RSSHub deployment and feed routes do not change.

## One-time setup

1. Create a Hyperdrive configuration for the existing Supabase PostgreSQL connection. Use the
   direct database connection on port 5432, not either pooled connection string. Do not put the
   connection string in the command history or commit it.
2. Put the returned Hyperdrive ID in `wrangler.jsonc`.
3. Add the required Worker secrets interactively:

   ```powershell
   pnpm --filter @rss-site/api exec wrangler secret put CRON_SECRET
   pnpm --filter @rss-site/api exec wrangler secret put REVALIDATE_SECRET
   ```

4. Generate and verify binding types:

   ```powershell
   pnpm --filter @rss-site/api cf-typegen
   pnpm --filter @rss-site/api check-types
   pnpm --filter @rss-site/api deploy:check
   ```

## Local Worker development

Create an untracked `server/api/.dev.vars` containing `CRON_SECRET` and `REVALIDATE_SECRET`, then
set the local Hyperdrive connection without adding it to source control:

```powershell
$env:CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE = '<postgres-connection-string>'
pnpm --filter @rss-site/api dev:worker
```

The existing `pnpm --filter @rss-site/api dev` command remains available for Node.js development
with `server/api/.env`.

## Cutover

Deploy with `pnpm --filter @rss-site/api exec wrangler deploy` and first verify the generated
`workers.dev` URL. Check `GET /health`, manually call one ingestion endpoint with `CRON_SECRET`, and
confirm the expected Supabase ingestion run, source status, and hot items.

Only after that verification, add this top-level entry to `wrangler.jsonc` and deploy again:

```jsonc
"routes": [{ "pattern": "rss-api.ljhboard.cn", "custom_domain": true }]
```

That second deployment moves the existing hostname to the Worker. Supabase Cron URLs do not need to
change because the public hostname remains the same. Keep Vercel available until the custom-domain
health check succeeds.
