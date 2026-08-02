# The Laws (docs/17) — one line each

Numbers are stable ids, never reused or renumbered — same rule as ADRs and migrations. A gap
means that law was removed; 2, 4 and 6 went on 2026-08-01 (CLAUDE.md §1–2 says it better).

1. **Foundation before features.** Feature modules build only on landed foundation.
3. **Contracts before code.** requirements → domain model → API contract → shared types →
   migration → implementation → verification → docs. Never in reverse.
5. **Reuse before creation.** Search the component indexes and contracts first. Creating
   what exists is a defect. Unmocked surfaces are COMPOSED from existing vocabulary.
7. **Shared component APIs stay in parity.** A prop or component on one platform only is a
   defect — `@heliogrid/ui-api` and `check:ui-parity` enforce it. WHICH screens each platform
   ships is a plan decision, not a law.
8. **Fix the docs your change made wrong** — in the same commit. Docs that are merely
   related are not your problem.
9. **Incremental schema & API growth.** Tables, enums, columns, contracts and endpoints are
   authored only when their OWNING module's slice begins. docs/04 is frozen DESIGN, not a
   build order. Asked to "implement the schema" → implement the CURRENT module's slice.
10. **Platform purity.** Shared packages hold no DOM, no React Native, no Node-only API
   outside a declared server entry. Platform work lives in the owning app behind an adapter.
11. **Flows are authored once.** Shared state vocabulary and view-model types are defined in
   a shared package before either screen consumes them. Screens render; they don't hold policy.

## Decision hierarchy

Defined once, in **docs/17 §4** — read it when layers actually conflict. Don't re-declare at
level N what a higher level already defines. Two tiebreakers that live only here: where a
cross-cutting rule and a per-package CLAUDE.md disagree, **the per-package file wins**; where
two records disagree, **the later-dated one wins**.

## Working principles (every change, not only slices)

- **Architecture first.** Name the affected modules and the dependency direction before you
  write code. If the change needs the architecture to move, say so and take it to the plan —
  never a local workaround.
- **Shared before local.** Ask "can this be shared?" BEFORE writing it. Duplicated business
  logic across web/mobile/api needs an owner ruling.
- **Minimise blast radius.** If something small needs edits across many unrelated files, the
  architecture is wrong. Say so first.
- **No temporary code.** No TODO implementations, no placeholder logic. If the owner asked for
  a stub, say so plainly when you present it.
- **Self-review your own diff** before presenting it: duplication, naming, edge cases, security,
  accessibility. Behaviour is proven by running it — `/qa`.

## Stop and ask the owner before

**Never invent a requirement.** Where docs are missing, ambiguous or contradictory: name the
conflict, state its impact, recommend one option, ask. Silently choosing is the failure this
prevents.

- Anything billable or external-account-shaped (Fly, store accounts, paid APIs).
- Schema or API work outside the current module (Law 9).
- A layer conflict the hierarchy above does not resolve.
- A product-shaped finding (missing business rule, UX gap, spec ambiguity) — record it in
  docs/13 or docs/15 first, then continue.
