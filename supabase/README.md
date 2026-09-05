# Supabase setup

Project ref: `pnjsrihfpyvkhyidzgfq` (`rss-site`, Singapore).

1. Apply files in `migrations/` in timestamp order.
2. Run the database test suite with `pnpm dlx supabase test db` when the local Docker stack is available.
3. Store `signal_ingest_base_url` and `signal_cron_secret` in Vault.
4. Run `cron/setup.sql` only after the Hono deployment URL and matching secret exist.

The browser may select `hot_items` and `source_status`. It has no write access and cannot read
`ingestion_runs`. Ingestion supports only the eighteen technology, news, and AI source IDs declared
by the latest migration, and each item must use its matching section.
