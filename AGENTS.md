# Repository delivery rules

## New signal source gate

Every new platform or feed source must pass the following production-data gate before its Cron job is enabled:

1. Probe the real upstream feed without credentials and record the chosen route or official feed URL.
2. Deploy every required API and RSSHub change before testing ingestion.
3. Apply the versioned migration to the linked cloud Supabase project. Local Docker checks are supplemental and must not replace or block this cloud validation.
4. Manually call the production `POST /cron/signals/:source` endpoint with the server-side `CRON_SECRET`.
5. Query cloud Supabase and verify that the run succeeded, `source_status` was updated, at least one `hot_items` row was written, and the stored title, URL, source, section, rank, and publication time are plausible.
6. Only after that verification may the source be added to or enabled in Supabase Cron. Confirm the job is active and uses Vault-backed secrets.
7. Record non-secret evidence (HTTP status, item count, batch ID, timestamps, and data-quality checks) in the relevant development document. Never print or commit database URLs, tokens, Vault values, or Cron secrets.

`pnpm setup:cron` must preserve this ordering: validate all configured sources against the deployed API and cloud database first, then schedule jobs.
