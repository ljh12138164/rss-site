# Redis first-deployment release bundle fix

## Background
The user supplied a failed production deploy for `fb0965c`: Docker loaded only the Web image, then `up --pull never web` could not find `redis:7.4-alpine`. The server successfully rolled back to `58b6d80`.

## Scope
Ship Web and Redis in the existing `image.tar` and check packaging behavior in CI.

## Out of scope
Translation code, database changes, SSH permission changes and production secret changes.

## Acceptance criteria
- Existing installed deployment scripts can load both images from the unchanged bundle file list.
- Registry access occurs on the CI runner before publishing the bundle; the production server does not need registry access.
- A failed Redis pull aborts packaging, without generating a deployable release.
- Existing rollback and archive validation remain intact.

## Feasibility
Feasible. Root cause is the deployment script update order: the installed old script runs the release and replaces privileged scripts only after successful health checks. A new `pull redis` added to the incoming script cannot bootstrap its own first deployment. Docker save/load supports multiple images in one archive, so packaging both images works with the existing installed loader and exact file allowlist.

The prior cache design remains accepted. This fixes its delivery path without changing runtime behavior. Fetch failed with a GitHub connection reset; the local `origin/master` is `fb0965c`, matching the failed deployment SHA supplied by the user. The fix is based on that exact deployed release.

## Implementation
- CI pulls `redis:7.4-alpine` and saves it with the release Web image to the existing `image.tar` before archiving.
- New deployment script inspects the bundled Redis image rather than pulling from the production server.
- A Python regression test executes the actual CI packaging shell block with a controlled Docker CLI and reads the resulting release archive. It verifies both image names and that pull failure prevents release creation.
- No changes to `REDIS_URL` are required: Compose still injects `redis://redis:6379`.

## Verification
- Red: both packaging tests failed against the prior workflow (Redis not pulled, and pull failure did not stop packaging).
- Green: `python3 deploy/server/test-release-packaging.py` passed both tests under WSL Ubuntu. YAML parsed successfully with PyYAML. `bash -n deploy/server/deploy-rss-site` and `git diff --check` passed.
- `pnpm test` passed all workspaces: 7 signals, 85 API and 231 Web tests (323 total).
- Biome does not process YAML in this repository; no Biome compliance claim is made. Shellcheck is unavailable in the local WSL environment; CI retains its existing shellcheck step. Local Docker daemon is unavailable, so actual multi-image save/load and production rollout require CI/deployment verification.

## Review
- Independent review checked the actual `58b6d80` loader and confirmed it loads the shared `image.tar` before Compose startup. Both images in that archive fix the first upgrade while preserving the existing allowlist and rollback path.
- No blocking findings remain and no accepted follow-ups require a roadmap.
- The fix branch is now published as `feat/fix-redis-release-bundle`, based on fetched `origin/master` (`fb0965c`). The local-only GTM commit remains on local `master` and is excluded from this branch. PR creation and merge remain owner actions under repository rules.
- Git transport recovered using `rtk proxy git` with per-command Schannel and DNS resolution options. No global Git settings were changed.

## Production incident and current delivery boundary
- At the user's explicit Workbench authorization, Redis was pulled on ECS and an 87 MB Web + Redis bundle was reconstructed on the production host. The original deployment script was dispatched for Web `fb0965c` with the reviewed incoming script. Subsequent Workbench and SSH access timed out; deployment success and rollback could not be verified.
- The user reported all services on that shared host were down, then confirmed they recovered. The instance has 2 CPU cores and 2048 MB RAM. Resource pressure is a hypothesis; host logs/metrics were not retrieved to establish the root cause.
- No reboot was performed. The current follow-up only publishes the CI fix branch; it does not run production commands or trigger a production workflow. Deployment completion and server resource safety are not claimed.

## Risks
- Bundle size increases by the Redis image layers. CI needs registry access, as it already does for Docker base images.
- Production deployment must be rerun for the fix commit; rerunning the old `fb0965c` workflow still uses its old packaging code.
- Production service recovery is user-confirmed; the Redis rollout state remains unverified. Further production operations need to account for the shared host's limited resources.
