# Deploy without GitHub Actions artifacts

## Background

PR #31 merged the article admin and Hono API changes, but its `master` workflow could not deploy. `actions/upload-artifact@v4` failed with `Artifact storage quota has been hit`; the live site still returned 404 for `/admin` and 405 for `/api/admin/articles` during regression. The `punycode` deprecation and one-day retention messages were warnings.

## Scope

- Remove the release bundle handoff through GitHub Actions artifact storage.
- Keep the existing PR verification and production environment gate.
- Build and smoke-test the same commit in the deployment job, then stream its release bundle to the server.

## Out of scope

- Billing changes, artifact cleanup, deployment server changes, and application code changes.

## Acceptance criteria

- A PR still runs tests, type checks, shell checks, image build, and runtime checks without publishing an artifact.
- A `master` push deploys only after verification and the production environment gate; the deployment job builds the checked-out commit, verifies `/healthz` and `/admin`, packages it, and streams it over SSH.
- The workflow contains no upload/download artifact steps.

## Feasibility

The release bundle is generated from the Docker image and three tracked deployment files. Rebuilding from the same commit in the deployment job avoids artifact storage while preserving the separate production environment. The second image build uses extra runner time; it also verifies the image that is actually shipped. GitHub documents artifact storage as a separate allowance from Actions cache storage, and the reported quota error blocks new uploads until usage is updated or billing changes.

## Implementation

The `verify` job retains its checks and no longer packages or uploads a bundle. The `deploy` job checks out the commit, uses the same public build arguments, builds the image, starts it for `/healthz` and `/admin` checks, packages the image, then runs the existing SSH deployment command. The existing production environment and concurrency gate remain in place.

## Verification

- Before the workflow edit, a forced local run passed 295 tests and all workspace type checks; changed-file Biome passed. Root lint still fails on pre-existing CRLF formatting and one unrelated suggestion.
- The prior app build passed with a local Supabase response stub. A build against the real Supabase URL from this Windows shell failed at prerender with `ECONNRESET`; this is a local network limitation rather than a compile error.
- The workflow parsed as YAML with `verify` and `deploy` jobs, and a check found no artifact upload/download action. `git diff --check` passed.
- The current app's local Next runtime returned 200 for `/healthz` and `/admin`, and the `/admin` HTML contained `文章管理`, matching the new deploy smoke test.
- Docker Desktop was unavailable on this Windows host, so the image build and SSH deployment remain CI-only checks. Existing deployment shell scripts are unchanged.
- PR workflow and production deployment: pending review and merge.

## Risks

- Rebuilding the image in the deployment job increases GitHub-hosted runner minutes.
- `/admin` cannot be fully exercised until the owner provisions the Supabase Auth administrator; the unauthenticated page and API access control can be smoke-tested now.

## Review

The diff preserves the existing PR verification, production environment, concurrency, SSH command, and post-deploy health check. The deploy job now independently builds and smoke-tests the image it sends to the server. No blocking findings or accepted follow-ups remain; no roadmap was created.
