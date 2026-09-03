---
name: maintain-blog
description: Maintain this Nextra personal blog when adding or editing MDX articles, changing navigation or SEO metadata, updating project or deployment documentation, verifying the static export, Pagefind index, sitemap, or Docker image, and resuming interrupted work recorded in HERMES.md.
---

# Maintain Blog

Keep content, metadata, generated search/SEO artifacts, and task handoff state consistent.

## Start or resume work

1. Read `/HERMES.md` before inspecting other project files.
2. If it describes active work, continue from its `下一步` and verify existing changes before redoing anything.
3. Otherwise write the new objective, status, next step, and planned verification into `HERMES.md`.
4. Never put credentials, tokens, private keys, or secret values in `HERMES.md` or any tracked file.

## Update content

For a new article:

1. Create `app/posts/<slug>/page.mdx`.
2. Export complete `metadata`: title, description, date, category, readingTime, canonical, Open Graph, and Twitter fields.
3. Add the same public summary to `lib/posts.ts`; keep ordering newest first.
4. Use one visible H1 through metadata; article bodies should begin at H2.
5. Keep claims specific and do not invent citations.

For navigation, theme, or copy changes, preserve the custom Nextra theme, Tailwind tokens, keyboard-accessible search, and responsive layout unless the request explicitly changes them.

## Keep documentation aligned

- Update `README.md` when developer-facing commands or entry points change.
- Update `docs/deployment.md` when CI, container, server, variables, secrets, health checks, or rollback behavior changes.
- Update `CONTEXT.md` only for stable project vocabulary, never implementation notes.
- Add an ADR only for a hard-to-reverse decision with a real trade-off that would otherwise surprise a future maintainer.

## Verify

Run from the repository root:

```bash
pnpm typecheck
pnpm build
```

Require `out/index.html`, `out/_pagefind/pagefind.js`, `out/sitemap.xml`, and `out/robots.txt` after the build.

When container files change, also run:

```bash
docker compose config
docker build -t blog:local .
```

Do not deploy merely because verification passes. Deploy only when the user explicitly requests production publication.

## Finish or pause

- After each verified phase, update `HERMES.md` with the current result and exact next action.
- Before an interruption, ensure another agent can resume using only `HERMES.md` and the working tree.
- On completion, reduce `HERMES.md` to `状态：空闲` and `下一步：无`; keep history in Git, ADRs, and durable documentation instead.
