# Fix Zhihu Cookie refresh production failure

## Background

PR #62 is deployed, but the authorized maintenance endpoint returns HTTP 502 / `request_failed`. Follow-up diagnosis identifies the actual failed operation and verifies the fix in workerd, instead of treating Node mocks as production validation.

## Scope

Correct the Workers request redirect mode and validate Cookie syntax before authenticated requests. Preserve the existing Cron, Vault state and Vercel publication design.

## Out of scope

Changing user credentials, bypassing Zhihu challenges, enabling automatic execution before real acceptance, changing feeds or database schema.

## Acceptance criteria

- A real Workers fetch executes through the shared request helper
- HTTP redirects are rejected without forwarding credentials
- Missing `z_c0=`, newlines and invalid Cookie header characters are rejected before an identity request
- Existing protocol and failure recovery tests pass
- Real account acceptance is reported separately from runtime compatibility verification

## Feasibility

Feasible, surgical backend correction. Branch `feat/fix-zhihu-cookie-refresh` starts at fetched `origin/master` / `551fb75`. Original workspace untracked documents remain untouched. Existing design review applies, with no architecture or UI change; `CONTEXT.md` is absent.

## Diagnosis

An authenticated version preview using existing Worker bindings isolated the following:

1. Hyperdrive connects, obtains the transaction advisory lock, reads Vault and opens the independent second transaction successfully
2. The configured Cookie is present but has no `=` and cannot be parsed as a nonempty `z_c0` pair; the user confirmed entering only the value. No secret values were returned or logged
3. A credential-free request to RSSHub health succeeds through native `fetch`, while the shared request helper throws immediately
4. The exact Workers error rejects `redirect: error` and requires `follow` or `manual`; testing bound/unbound fetch receivers ruled out a receiver issue

The generic 502 is caused by the unsupported redirect mode. Invalid Cookie configuration is a separate blocker. The initial diagnosis could not determine the cause from the generic response; the version-preview differential test resolved that uncertainty.

## Implementation

- Shared `requestJson` uses `manual`. Its existing non-2xx check rejects 3xx and releases the response body without following the Location header
- `assertZhihuCookie` validates a nonempty `z_c0` pair and ASCII Cookie header characters before identity and refresh requests
- The rotation workflow validates the selected saved/seed Cookie before invoking identity, without interfering with pending candidate or deployment recovery
- The environment example and setup instructions explicitly show the required `z_c0=` prefix
- New workerd tests use the Miniflare/esbuild bundled by the locked Wrangler, with an in-process outbound service. Native fetch performs RequestInit validation; external network and production secrets are not used

## Verification

- 2026-11-02, Asia/Shanghai: cloud database probe succeeded in 1185 ms, native public fetch returned 200, original helper failed before the outbound request due to unsupported redirect mode
- Before the fix, 8 focused regression assertions failed. The dedicated native workerd tests also both failed when the original redirect mode was restored, then passed with `manual`
- `pnpm --filter @rss-site/api test`: 16 files / 154 tests passed, including native workerd success and rejection of a credential-bearing redirect after one outbound request
- `pnpm --filter @rss-site/api check-types`: passed
- Complete API preview bundle: 606.82 KiB / gzip 134.71 KiB; upload succeeded, version `4f7b05d1-5357-456e-ae78-3de698618c92`
- Authorized request to the fixed full API preview at 15:52:09 returned HTTP 502 / `invalid_cookie`, correctly identifying the malformed configured seed before an upstream request
- No real Cookie refresh or Vercel update occurred during the diagnostic probes. Production traffic and Cron configuration were not switched by version uploads

## Review and delivery

Standards and spec self-review found no remaining implementation blocker or accepted follow-up requiring a roadmap. The production end-to-end acceptance remains gated on the owner updating the Cookie and merging/deploying the fix. Do not enable automatic execution before that acceptance.

## Risks

A correctly formatted Cookie may still be expired or blocked by Zhihu; Vercel token permissions and deployment acceptance require a successful real refresh. Secret binding existence alone does not establish validity. Diagnostic version URLs are authenticated, temporary code is outside the repository, and active aliases are restored to the complete API before delivery; past immutable versions remain in Cloudflare version history.
