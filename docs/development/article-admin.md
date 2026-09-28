# Article admin and Hono API

## Background

The site has a public Next.js app, Hono translation routes, and Supabase article storage. The operator needs one private place to inspect and correct articles. Existing `/api/*` handlers use separate Next route files, so RPC types do not cover the full client/server boundary.

## Scope

- `/admin`: one Supabase Auth administrator signs in, pages through articles, and edits title, summary, body HTML, image URL, author, publication time, and pinned state.
- Move existing `/api/*` endpoints into the current Hono catch-all route without changing their paths or external contracts. Use `hc<AppType>` for browser calls.
- Supabase RLS and column grants authorize edits; server and browser never expose a service key.
- Keep editorial changes through later ingestion and reflect them in current hot items, including when the deployed Worker is older than the web app.

## Out of scope

- Article creation, deletion, multiple admin roles, and source configuration.

## Acceptance criteria

- Only a user with server-set `app_metadata.role = 'article_admin'` can change the allowed article columns.
- Login, loading, empty, error, list, edit, and save states work on desktop and mobile.
- Ingestion does not overwrite a manually edited article; public article and ranking data show the saved values.
- All existing API URLs, status codes, response bodies, and cache headers remain compatible.
- Full tests, type checking, lint, and production build pass.

## Feasibility

Feasible on the existing Next 16, Hono 4, Supabase JS 2, and Postgres 17 stack. The Hono catch-all route already hosts translation endpoints. `signal_articles` is publicly readable but write-restricted, so the migration adds authenticated column grants and a role-checked update policy. Ingestion currently overwrites article and hot-item metadata; database triggers protect edited values without requiring a coordinated Worker release. The UI reuses the existing Swiss Editorial tokens, React, Tailwind, and icons. UI Skills MCP was not available in this task; existing repository UI rules are the fallback.

## Implementation

Working interface brief: one site operator, correcting news records; dense editorial list with a focused edit panel. Existing white/slate/teal palette, serif heading, sans-serif controls, fine dividers, compact spacing. Desktop list and editor share one page; mobile stacks them. The existing `/admin` route is new and intentionally absent from public navigation.

The administrator is provisioned by the owner in Supabase Auth. After creating one email/password user, set only that user's server-controlled `raw_app_meta_data.role` to `article_admin` from a trusted Supabase administration surface, then sign out and back in so the access token includes the role. Keep public signup disabled. The browser uses the publishable key; the Hono server validates the bearer token with Supabase Auth and forwards that token for RLS-protected reads and edits.

For an existing Auth user, the owner can run this in the Supabase SQL Editor with the UUID copied from Auth → Users (replace the placeholder before running):

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || '{"role":"article_admin"}'::jsonb
where id = '<admin-user-uuid>'::uuid;
```

Deployment order: apply the migration, then deploy the Next web app. The database triggers protect edited rows from the existing Worker. The migration does not require a new feed source or Cron job.

The local Supabase CLI was absent. A pinned `pnpm dlx supabase@2.79.0 migration new article_admin` attempt stalled while downloading the CLI release, so the versioned migration file was created with the same timestamp format and validated transactionally against the linked cloud schema.

## Verification

- `pnpm test`: 295 tests passed across Web (203), API (85), and Signals (7).
- `pnpm check-types`: all three workspaces passed.
- Changed-file Biome check passed. Root `pnpm lint` remains blocked by pre-existing CRLF formatting and an unrelated `article-route.ts` suggestion; those files were not reformatted.
- Real Supabase connection from the shell reset during prerender. With a local empty-response Supabase stub, `pnpm --filter @rss-site/web build` compiled, type-checked, and generated all 61 pages, including `/admin` and Hono `/api/[[...route]]`, after the final code changes.
- The migration and data checks were executed against the linked cloud project inside transactions and rolled back: admin RLS update succeeded, non-admin update affected no rows, the current hot item and automatic AI event followed editorial titles, and subsequent direct database updates did not overwrite the edited article or hot item. A post-rollback schema query confirmed `editorial_locked` was absent.
- Desktop browser inspection: `/admin` login rendered without overflow at 1280px. Authenticated UI and mobile rendering remain unverified because the owner will provision the only admin account after delivery and the available in-app browser did not offer viewport resizing.
- The newest 30 production articles total about 90 KB of body HTML, so returning bodies with the initial editor list is acceptable at the current data size.

## Review

The final diff was checked against repository standards and the acceptance criteria. API paths and response contracts match the previous Next handlers; all browser API calls use the Hono RPC type, and the admin write path uses both server-side Auth validation and Postgres RLS. Transactional cloud checks cover the ingestion overwrite and related-table triggers. No blocking findings or accepted follow-ups remain, so no roadmap was created. The full-repository lint baseline, authenticated browser flow, and mobile visual check remain verification limitations as recorded above.

## Risks

- The administrator must be provisioned separately in Supabase Auth and given server-controlled app metadata; public signup does not grant rights.
- Production migration must precede the web app release. A migration alone does not expose privileged operations without the admin role.
- An editorial edit locks all seven content fields for that article, including any fields whose value was unchanged in that edit. A future selective per-field override would require a different data model.
