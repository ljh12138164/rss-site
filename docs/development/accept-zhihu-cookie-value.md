# Accept the raw Zhihu login Cookie value

## Background

The user configured the raw `z_c0` value and explicitly requested that the API add the cookie name. Requiring manual prefixing in the environment variable exposed a protocol detail unnecessarily.

## Scope

Normalize the initial `ZHIHU_COOKIES` seed to a complete Cookie string. Accept the raw value, including `=` padding, while preserving a named `z_c0` pair or complete Cookie string.

## Out of scope

Changing stored credentials, login protocol, schedule or Vercel deployment behavior. The browser curl supplied in chat is not copied to files, commits, logs or tests.

## Acceptance criteria

Raw seed values reach identity and refresh as `z_c0=value`. Named and complete Cookies are unchanged. Empty named values, missing login keys in complete Cookies and control characters remain rejected. Rotation persists and publishes a complete Cookie, never a bare value.

## Feasibility

Feasible with initialization-only normalization. Existing design and backend review remain applicable; no UI or schema change. Branch starts from fetched `origin/master` at `97377e7`. Existing Vault state takes precedence, preserving pending credential and deployment recovery.

## Implementation

When Vault is empty, preserve a seed with a `z_c0` pair or semicolon-separated Cookie list; otherwise prefix the raw seed with `z_c0=`. Existing validation then runs before any authenticated request. Protocol methods continue to accept canonical Cookie strings internally. No secret changes are required for an existing bare-value seed.

Following successful real refresh/publication acceptance below, set `ZHIHU_REFRESH_ENABLED=true` in source configuration. The existing native schedule is `0 20 * * *`, daily 04:00 Asia/Shanghai. This becomes active when the owner merges and deploys the branch; no Supabase Cron is used.

## Verification

The raw-value and padded-value tests failed before normalization and passed after the change. `pnpm --filter @rss-site/api test`: 16 files / 160 tests passed, including native workerd checks. API type check passed. Full Worker preview upload succeeded at 606.95 KiB / gzip 134.76 KiB, version `00cb3adf-95bb-4a63-a234-54ced0bc144f`.

Real acceptance, 2026-11-02 Asia/Shanghai:

- 17:13:55: authorized full API preview returned HTTP 202 / `deployment_pending`, deployment `dpl_Bfz57d2VLQnuZWWuGXGsK3LEJtZG`, using the existing raw Worker secret with no user credential change
- Vault state created at 17:13:49, latest Cookie and account identity persisted; only presence flags and operational metadata were queried, never their values
- 17:14:07: repeated invocation returned the same deployment ID, proving it resumed pending publication instead of rotating again
- Vercel deployment reached READY at 17:15:53, target production, expected RSSHub project, `aliasAssigned=true`, including `rss.ljhboard.cn`
- 17:16:16: authorized call to the actual production Worker returned HTTP 200 / `published` after verifying the pending deployment from shared Vault state
- RSSHub `/api/zhihu/check-cookie` returned HTTP 200 / `code=0`; `/healthz` returned HTTP 200

- 17:17:14: Vault metadata confirmed publish_pending=false, candidate absent and deployment ID cleared
- 17:17:55: repeat production invocation returned HTTP 200 / not_due, confirming the cooldown prevented another rotation

Production rotation used the existing Vault and Vercel project. The initial raw-value normalization ran in the branch preview; deployment verification then passed through the existing production API. The normalization and source Cron flag changes themselves remain pending the owner-created PR and production deployment. HTTP checks do not substitute for observing the next scheduled invocation.

## Review and delivery

Standards/spec review completed: existing named/full Cookie strings and pending Vault state remain unchanged, padded bare values are supported, malformed headers remain rejected, and saved/published credentials are canonical strings. No unresolved implementation blocker or accepted follow-up requires a roadmap. Final API regression, regenerated binding types, formatting and branch push are recorded in the delivery state.

## Risks

Syntax normalization cannot make an expired or upstream-blocked credential valid. No actual Cookie content is logged. Historical descriptions of rejected value-only configuration in earlier regression records describe the old implementation.
