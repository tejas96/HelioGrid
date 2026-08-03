---
paths:
  - "apps/web/**"
---

# apps/web — Next.js

Architecture: `docs/architecture.md` §2 apps/web · §3 platform rules.

## Where files go

```
app/<route>/page.tsx        routing only — reads params, renders one screen
app/                        layout · providers · loading · error · not-found · route (BFF glue)
features/<capability>/      the work lives here, named for the capability, matching the
  <Name>Screen.tsx          api module that serves it
  components/<Part>.tsx     one file per component
  hooks/use-<thing>.ts      the controller hook belongs to the SCREEN, never the page
  <screen>.css              screen layout, token var() only
  constants.ts · types.ts   literals · types two files in the feature share
  shared/                   only when two SCREENS in this feature share
  index.ts                  the barrel — app/ imports through it and nothing deeper
lib/                        app infrastructure (ApiErrorText, env.ts)
```

Two features sharing something means it is not feature-local — it belongs in a package
(`docs/architecture.md` §4).

## Rules

- **Server/Client boundary: `docs/architecture.md` §3** — that section states where the
  directive belongs; this file does not restate it. What it means at edit time: a
  `'use client'` at the route level opts every child in, so know which level you are on.
- **`page.tsx` routes and nothing else** — it renders the Screen; container logic lives in
  the feature's Screen and its `use-*.ts` hook (`.claude/rules/ui-adherence.md`).
- **DOM-only APIs (`window`, `document`, `navigator`, `localStorage`) never appear in a
  shared package** (Law 10) and inside `apps/web` only in a Client Component or an effect —
  module scope runs on the server during SSR and will crash the render.
- **Server-only work stays server-only.** Route handlers, server actions and secrets never
  become imports of shared UI: `@heliogrid/env/server` is unimportable from a client file.
- `lib/env.ts` writes `process.env.NEXT_PUBLIC_*` out LITERALLY and is allowlisted in both
  env enforcers — Next inlines those only in code IT compiles, so the read cannot move into
  a pre-built package. Do not "fix" it.
