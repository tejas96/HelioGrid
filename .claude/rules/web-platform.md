---
paths:
  - "apps/web/**"
---

# apps/web — Next.js platform boundary

Platform law: `docs/architecture.md` §3. This file is what that law means at edit time.

- **Server by default; `'use client'` is a decision.** A route is a Client Component only
  when it needs state, effects, or browser events. Push the directive as far DOWN the tree as
  it goes: a `'use client'` at the route level opts every child in.
- **`page.tsx` routes and nothing else** — it renders the Screen; container logic lives in
  the feature's Screen and its `use-*.ts` hook (`.claude/rules/ui-adherence.md`).
- **DOM-only APIs (`window`, `document`, `navigator`, `localStorage`) never appear in a
  shared package** (Law 10) and inside `apps/web` only in a Client Component or an effect —
  module scope runs on the server during SSR and will crash the render.
- **Server-only work stays server-only.** Route handlers, server actions and secrets never
  become imports of shared UI: `@heliogrid/env/server` is unimportable from a client file.
- Data reaches a screen through `@heliogrid/data` only (`apps-never-touch-the-wire`, lint).
- `lib/env.ts` writes `process.env.NEXT_PUBLIC_*` out LITERALLY and is allowlisted in both
  env enforcers — Next inlines those only in code IT compiles, so the read cannot move into
  a pre-built package. Do not "fix" it.
