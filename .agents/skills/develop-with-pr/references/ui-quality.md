# UI quality and review

Read this reference only when a change affects a user-visible interface.

## Load the design guidance

Use the UI Skills MCP registry before proposing, implementing, or reviewing UI.
Load these two skills completely as the default baseline:

- `dammyjay93/interface-design` for product-interface hierarchy, density,
  surfaces, tokens, states, and visual craft.
- `ibelick/baseline-ui` for implementation constraints, accessibility,
  typography, overflow, motion, and anti-slop checks.

Query the registry for an additional specialized skill only when the surface
actually needs it, such as accessibility remediation, typography, responsive
adaptation, or motion-performance work. Do not load unrelated skills.

Prefer the native MCP tools. If the MCP server is configured but not exposed to
the current task, a read-only MCP protocol call to `tools/list` and `get_skill`
is an acceptable fallback. If the guidance cannot be retrieved, state that
constraint, use the repository's existing design system, record the fallback in
the development document, and never claim that a UI Skills review occurred.

## Reuse accepted decisions

- Inspect the development document, roadmap, ADRs, Hermes state, merged work,
  existing routes, and representative screens before proposing a direction.
- Do not repeat a completed UI review when the delivery surface, visual system,
  responsive scope, and material assumptions are unchanged. Review only the
  delta and record which earlier decisions were reused.
- Do not add an unconfirmed page, route, dialog, panel, UI library, or visual
  direction. New UI dependencies require explicit user approval.

## Establish the interface contract

Before editing, record a compact working brief covering:

- the actual person, primary action, and intended feel;
- focal element and hierarchy;
- palette and one intentional accent;
- depth strategy and surface relationship;
- typography hierarchy;
- spacing base and chosen density.

Use the repository's existing components, tokens, icons, and primitives first.
Prefer semantic tokens and `cn` over hard-coded visual values or duplicated
class logic. Avoid card soup, decorative gradients, glow, arbitrary shadows,
mixed radius systems, and animation that does not communicate state.

## Repository UI invariants

- Constrained application chrome defaults to one line with ellipsis: titles,
  tabs, badges, statuses, property labels, toolbar labels, and thumbnail titles.
  Pair `min-w-0` with `truncate` inside flex or grid containers and expose the
  full value with an accessible label or `title` when useful.
- Do not truncate conversation bodies, instructions, validation messages, or
  actionable error details merely to protect layout. These must remain readable
  and wrap naturally.
- Loading and generation states must look specific to the product and show the
  most honest available progress or artifact state. A generic centered spinner
  is insufficient for a primary workflow. Do not invent precise progress that
  the backend cannot support.
- Use `h-dvh` rather than `h-screen` for full-height application surfaces.
- Use tabular numbers for changing numeric data. Associate labels with form
  controls, label icon-only buttons, preserve keyboard behavior, and keep focus
  states visible.
- Use one clear action in empty states. Render loading, empty, generating,
  success, retrying, recoverable error, and terminal error states only where they
  materially differ for this surface.
- Do not add motion unless it communicates requested or existing state. Keep
  feedback brief, animate compositor properties only, and respect reduced
  motion.

## Verify before review closes

- Run formatting, type, test, and production-build checks proportionate to the
  change.
- Inspect the rendered interface at the confirmed desktop width and every
  responsive class in scope. Exercise the changed states, not only the default.
- Check overflow, single-line truncation, content wrapping, focus, empty/error
  states, theme contrast, and layout stability. Use screenshots for visible PR
  changes when possible.
- Apply the UI Skills squint, hierarchy, signature, and token checks. Resolve
  blocking findings before pushing.
- If authentication, infrastructure, or unavailable browser state prevents
  visual verification, record the exact unverified surface and do not describe
  visual QA as complete.

Record the loaded UI Skills, reused decisions, material UI choices, rendered
states, viewport coverage, and verification evidence in the development
document.
