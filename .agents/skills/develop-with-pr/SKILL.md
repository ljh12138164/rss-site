---
name: develop-with-pr
description: Implement product-code or behavior changes through a clean feat branch, a living development document, completed reviews, a review-derived roadmap, verified commits, and a GitHub pull request. Use for features, bug fixes, refactors, and performance work; do not require it for copy-only changes, documentation-only updates, or urgent production diagnosis.
---

# Develop with PR

Keep one development task isolated, documented, verified, and reviewable.

## Start or resume

1. Read `/HERMES.md`, `/CONTEXT.md`, and applicable repository instructions.
2. Inspect the branch, worktree, remotes, and existing `docs/development` documents.
3. If resuming a matching `feat/*` branch, continue from its development document and Hermes state.
4. Otherwise require a clean worktree. If unrelated changes exist, stop and ask the user to commit, stash, or discard them; never stash or discard automatically.
5. Fetch the remote default branch and create `feat/<short-kebab-name>` from its latest commit. If fetching is externally unavailable and the user explicitly confirms the local baseline is current, record that confirmation and the fetch failure in the development document, then create the branch from that local baseline. Never develop directly on the default branch.
6. **Reuse accepted design decisions before requesting another review**
   - Inspect applicable ADRs, roadmap entries, development documents, merged pull requests, `CONTEXT.md`, and Hermes state for decisions that already cover the proposed slice.
   - Reuse a prior review without asking the user to reconfirm when its scope, dependencies, domain language, constraints, and material assumptions still match the current work. Record the evidence and reused decisions in the development document.
   - Run `/grill-with-docs` only for unresolved, changed, contradictory, or newly introduced high-impact decisions. Keep the review focused on those deltas and ask one decision at a time.
   - If no material design delta remains, state that the existing review is sufficient and proceed to feasibility assessment. Do not repeat a completed review merely because a new implementation branch or pull request was created.
   - If a focused review reveals the proposal is fundamentally flawed or out of scope, stop and report to the user; do not proceed with implementation.
7. **Assess feasibility and technical bottlenecks before implementation (技术可行性与难点评审):**
   - Verify the proposal against the repository's architecture, runtime and dependency constraints, available APIs and data, migration or compatibility needs, and relevant security, performance, and delivery risks.
   - **Review core technical bottlenecks and provide actionable guidance (深度挖掘技术难点并提供解决方案):** Actively identify non-obvious failure modes and hard engineering challenges (e.g., cross-platform rendering divergence, token/payload limits, high-frequency state flooding, concurrent race conditions, memory management). Formulate concrete, high-leverage architectural solutions, operational invariants, and mitigations to help the user make sound technical decisions.
   - Base conclusions on repository evidence. Resolve any assumption that could change the approach with a focused read-only check or the smallest useful spike, and record remaining unknowns.
   - Classify the proposal as feasible, conditionally feasible, or infeasible. For a conditionally feasible proposal, state the conditions and obtain user confirmation before proceeding. For an infeasible proposal, stop and explain the blocker and viable alternatives.
   - Record the evidence, conclusion, constraints, bottlenecks, and required validation in the development document under Feasibility.
8. **Confirm the UI delivery surface, visual direction, and technology stack:**
   - Apply this review only when the change affects a user-visible interface. Reuse an earlier UI confirmation when its page scope and assumptions still match; review only new or changed surfaces.
   - Read and follow [UI quality and review](references/ui-quality.md). Retrieve the applicable UI Skills MCP guidance before proposing or implementing a visual change; do not claim UI Skills compliance when the guidance could not be loaded.
   - **Define the delivery surface before discussing style:** Inspect existing routes and representative screens, then propose the smallest concrete inventory of routes, screens, panels, dialogs, or overlays required by the task. For each surface, state its purpose, primary user action, major layout regions, entry/exit path, and whether it is new or modifies an existing surface. Distinguish full pages from embedded panels and reusable components.
   - **Define required states and responsive scope:** Identify only the states that materially change the experience, such as loading, empty, generating, success, validation failure, permission failure, reconnecting, and unrecoverable error. State which viewport classes and input methods are in scope; do not silently imply mobile parity or advanced accessibility interactions that the task did not request.
   - **Inspect the technology stack:** Inspect package manifests, lockfiles, imports, configuration, the existing design system, shared UI components, tokens, styling engines, icon sets, and representative screens. Identify the established component library and distinguish it from styling, icon, and utility libraries.
   - **Recommend a product-specific interaction and visual approach:** Ground page hierarchy, navigation, workspace topology, interaction flow, density, and layout templates in the product's purpose. Prefer established application patterns and reusable repository components over speculative screens or a parallel design system.
   - Summarize the proposed surface inventory, page-level states, responsive scope, visual direction, component library and styling tools with versions, and specific components to reuse.
   - Ask the user to confirm the surface inventory and routes, page responsibilities and key states, interaction layout, visual direction, responsive scope, and UI stack. A concise grouped confirmation is sufficient when these choices form one coherent proposal.
   - Do not write UI code until the required surface and visual decisions are confirmed. Adding or replacing a UI library requires explicit user approval. If the user declines the review, record that decision and continue without treating unconfirmed details as accepted.
   - Record the confirmed UI delivery surface and implementation decisions in the development document. Acceptance criteria for UI work must trace to the confirmed surfaces and states; do not add unconfirmed pages during implementation.
9. **Create the development document** at `docs/development/<short-kebab-name>.md`, populating it with the outcomes of the design and feasibility reviews:
   - Background
   - Scope
   - Out of scope
   - Acceptance criteria
   - Feasibility
   - Implementation decisions
   - Risks
   (These sections may be directly copied or adapted from the design review output and ADRs.)
10. Record the active objective and next action in `/HERMES.md`.

## Maintain the development document

Use these sections:

```md
# <Task title>

## Background
## Scope
## Out of scope
## Acceptance criteria
## Feasibility
## Implementation
## Verification
## Risks
```

Update the document as implementation decisions, scope, verification evidence, and risks change. Do not treat it as an activity log.

## Implement and verify

1. Implement only the agreed scope, following repository instructions and any requested development method such as TDD. For user-visible work, apply the loaded UI Skills guidance and the repository-specific constraints in [UI quality and review](references/ui-quality.md).
2. Run the smallest relevant checks while iterating, then the repository-level checks proportionate to the change before review.
3. Record commands and outcomes under Verification. Record material deviations and their rationale under Implementation.
4. Keep commits scoped and reviewable. Do not include unrelated worktree changes.

## Close reviews and create the roadmap

1. Review the completed diff against both repository standards and the development document's acceptance criteria. Use a dedicated review skill when the user requests one or repository instructions require it.
2. Classify every finding as:
   - **Blocking:** required for correctness, acceptance criteria, security, compatibility, or safe delivery. Resolve it in the current branch and review again.
   - **Accepted follow-up:** valuable, evidence-backed work that is explicitly outside the current PR scope and does not make the PR unsafe or incomplete.
   - **Rejected:** not applicable, unsupported, or intentionally declined; record the reason when it may otherwise be raised again.
3. Reviews are complete only when no blocking finding remains and the development document reflects the final implementation and verification evidence.
4. After reviews are complete, create or update `docs/roadmaps/<short-kebab-name>.md` from accepted follow-ups. Do not use the roadmap to defer blockers or invent speculative work. If there are no accepted follow-ups, record that conclusion in the development document instead of creating an empty roadmap.
5. Give each roadmap item:
   - Outcome and user or engineering value
   - Evidence or originating review finding
   - Dependencies and sequencing constraints
   - Completion signal that can be verified
   - Priority horizon: Now, Next, or Later
6. Link the roadmap from the development document and the development document from the roadmap. Keep implementation detail in the development document or an ADR; keep the roadmap focused on sequencing and outcomes.

Use this compact roadmap shape:

```md
# <Task title> roadmap

## Context

Related development document: [<Task title>](../development/<short-kebab-name>.md)

## Now
### <Outcome>
- Value:
- Evidence:
- Dependencies:
- Completion signal:

## Next
## Later
```

## Open and maintain the pull request

1. Push the feature branch and open or update its pull request only after local verification is proportionate to the change.
2. Summarize scope, important decisions, affected workspaces, verification, migration or environment requirements, and the roadmap link when one exists.
3. Inspect CI and review feedback. Resolve blocking findings, update the development document and roadmap classification, rerun affected checks, and push focused commits until the PR is reviewable and no blocker remains.
4. Update `/HERMES.md` with the PR, final status, remaining accepted follow-ups, and the next concrete action.
