# Local Drizzle Studio

## Background

Provide a local entry point for browsing the existing database with Drizzle Kit Studio.

## Scope

- Root and API `pnpm db:studio` scripts, loading the existing API `.env` file.
- PostgreSQL Studio configuration reusing `src/db/schema.ts`.
- Document the command, browser URL, connection target and write behavior.

## Out of scope

Database provisioning, schema changes, migrations, deployment and Cron changes.

## Acceptance criteria

- The root command starts Studio on loopback port 4983.
- Studio loads the existing schema and can read the configured database.
- Credentials remain in the ignored environment file.

## Feasibility

Feasible. API already includes drizzle-kit 0.31.10, drizzle-orm 0.45.2 and postgres 3.4.9.
Node 24 supports native `--env-file`; no new dependencies are required. The existing schema and
server-only DATABASE_URL contract are reused. This adds a developer tool with its vendor interface,
so no application UI decisions are introduced. The installed CLI defaults to host 0.0.0.0;
explicitly bind 127.0.0.1. Startup alone does not prove database connectivity; verify a read too.

Reference: https://orm.drizzle.team/docs/drizzle-kit-studio

## Implementation

Invoke the installed CLI with Node's environment-file loader. Reuse the API database URL and fail
clearly if it is missing. Keep Supabase migrations as the source of schema changes.

## Verification

- `pnpm db:studio`: starts successfully using the existing ignored API `.env`.
- HTTPS POST to the local Studio: init HTTP 200, protocol 6.2, PostgreSQL.
- Read through Studio's query proxy: HTTP 200; `public.hot_items` count 996.
  No writes were performed. The temporary probe was removed after verification.
- API type check, including the new config, and changed-file Biome checks passed.
- `git diff --check` passed.
- Standards/spec self-review: no blocking findings or accepted follow-ups; no roadmap needed.

## Risks

Studio permits writes with the configured database role. A local Studio connected to cloud Supabase
operates on cloud data. The README makes this explicit. No credentials are committed.
