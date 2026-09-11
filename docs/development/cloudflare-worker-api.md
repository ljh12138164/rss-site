# Cloudflare Worker API migration

## Background

`rss-site-api` currently runs on Vercel and accounts for material function runtime. The API already
uses Hono's Fetch-compatible interface, so it can move to Cloudflare Workers while the self-hosted
RSSHub, Supabase database, public API hostname, endpoint paths, and Supabase Cron schedules remain
unchanged.

The user explicitly requested implementation on the current
`feat/fix-fullscreen-section-skeletons` branch rather than creating a separate feature branch.

## Scope

- Migrate only `server/api` from the Vercel runtime to Cloudflare Workers.
- Configure Wrangler, required secrets, observability, and the existing
  `https://rss.ljhboard.cn` RSSHub base URL; stage the custom-domain cutover after Worker validation.
- Connect the Worker to the existing Supabase PostgreSQL database through Hyperdrive.
- Preserve the existing Node.js local-development and administrative CLI paths.

## Out of scope

- Changes to RSSHub, feed routes, signal sources, the web application, database schema, or Supabase
  Cron schedules.
- Production cutover before a real Hyperdrive ID and Worker secrets are configured.

## Acceptance criteria

- `src/index.ts` is a valid module Worker entrypoint and does not read deployment configuration at
  module initialization.
- All existing HTTP routes and authentication behavior remain unchanged.
- Production database traffic uses a generated Hyperdrive binding and connections are closed after
  each ingestion request.
- Wrangler type generation, TypeScript, API tests, and deployment dry-run pass.
- Deployment instructions contain no credentials and describe the production verification gate.

## Feasibility

Feasible. Hono exposes a standard Fetch handler, `postgres` 3.4.9 meets Hyperdrive's supported
version, and current Workers Node.js compatibility provides the Node APIs used by the API. The main
deployment condition is creation of a Hyperdrive configuration for the existing Supabase database.

Technical risks are bounded Worker memory while reading upstream feeds and remote database
connection churn. Feed responses are capped at 5 MB and read as a bounded stream. A database client
is created only for an authenticated ingestion request and is closed in `finally`; Hyperdrive owns
the upstream connection pool.

## Implementation

- Replaced the Vercel config and entrypoint assertion with `wrangler.jsonc`, generated binding/runtime
  types, and a Worker deployment assertion.
- Added a runtime app factory so Cloudflare bindings and the existing Node `.env` path share the same
  Hono routes without module-level request state.
- Added `createDatabaseConnection` for request-scoped lifecycle management while preserving the
  existing `createDatabase` API used by Node-only tooling.
- Kept cache revalidation behavior and passed Worker bindings explicitly.
- Deployment and cutover steps are documented in `server/api/CLOUDFLARE.md`.

## Verification

- `pnpm --filter @rss-site/api cf-typegen`: generated bindings and runtime types successfully.
- `pnpm --filter @rss-site/api test`: 7 files and 60 tests passed before the Worker deployment
  assertion was added; final result is recorded after rerunning.
- `pnpm --filter @rss-site/api check-types`: passed.
- `pnpm --filter @rss-site/api deploy:check`: bundled successfully at 547.92 KiB / 120.22 KiB gzip.
- Full API Biome currently reports pre-existing CRLF formatting diagnostics; changed-file Biome is
  used for this migration and its final result is recorded after formatting.

## Risks

- Hyperdrive `rss-site-supabase` is bound in `wrangler.jsonc`. Its current origin was observed as the
  Supabase session pooler; production deployment must not start until the origin is changed to the
  Supabase Direct connection and required secrets are installed.
- The custom domain is intentionally absent from the initial deployment. Add it only after the
  `workers.dev` health check, one authenticated production ingestion, and its Supabase writes are
  verified; keep Vercel available through the final custom-domain health check.
