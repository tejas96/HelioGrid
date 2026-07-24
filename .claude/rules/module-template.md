# Template — per-package CLAUDE.md

Every `apps/*` and `packages/*` gets a CLAUDE.md at creation, from this template.
Keep it under ~60 lines; it loads on top of the root constitution. Delete sections
that genuinely don't apply; never leave placeholders.

```markdown
# <name> — <one-line role in the system>

## What lives here / what must never live here
<2-6 bullets. e.g. "domain math only — no IO", "controllers implement contracts,
no business logic in controllers">

## Commands
pnpm --filter <name> typecheck | lint | test | dev
<any package-specific dev loop: e.g. drizzle-kit generate, lingui extract>

## Depends on / depended on by
uses: <packages>        used by: <apps/packages>
(dependency-cruiser enforces this — if you need a new edge, update the ruleset
consciously and note why in the commit)

## Local conventions
<naming, file layout, patterns specific to this package — e.g. "one Nest module per
bounded context; services return domain types, controllers map to contract types">

## Landmines
<known sharp edges: metro config, RLS session vars, normalize-on-read, etc.>

## Definition of done here
<the package-specific additions to the global gates — e.g. "screen: 375px + Hindi
checked" or "migration: invariant round-trip green">
```

Rules for authors of per-package CLAUDE.md files:
- Commands must be copy-paste runnable. No prose where a command works.
- Landmines section is mandatory once the first sharp edge is discovered — an agent
  hitting a trap that a previous agent already hit is a documentation failure.
- Update the file in the SAME commit that changes the convention it documents.
