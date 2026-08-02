# The Laws — one line each (digest of docs/17 §1)

This is the always-loaded digest. Canonical text: `docs/17-engineering-governance.md` §1,
which names this file as its digest. Numbers are stable ids, never reused or renumbered — a
gap is a law that was removed (2, 4 and 6 went on 2026-08-01).

1. **Foundation before features.** Feature modules build only on landed foundation.
3. **Contracts before code.** requirements → domain model → API contract → shared types →
   migration → implementation → verification → docs. Never in reverse.
5. **Reuse before creation.** Search first; creating what exists is a defect. Unmocked
   surfaces are COMPOSED from existing vocabulary.
7. **Shared component APIs stay in parity.** A prop or component on one platform only is a
   defect — `@heliogrid/ui-api` and `check:ui-parity` enforce it.
8. **Fix the docs your change made wrong** — same commit. A change that DELETES or MOVES
   files greps `.claude/`, `docs/`, configs and `.env.example` for the dead paths.
9. **Incremental schema & API growth.** Tables, enums, columns, contracts and endpoints are
   authored only when their OWNING module's slice begins.
10. **Platform purity.** Shared packages hold no DOM, no React Native, no Node-only API
    outside a declared server entry. Platform work lives in the owning app behind an adapter.
11. **Flows are authored once.** Shared state vocabulary and view-model types are defined in
    a shared package before either screen consumes them. Screens render; they don't hold policy.

## Where the answer lives

- **"Where does this code go?"** → `docs/architecture.md` §4 (placement), §2 (registry).
- **"May X import Y?"** → `docs/architecture.md` §2. **"Is this web-only / RN-only?"** → §3.
- **"What enforces this rule?"** → `docs/17` §5 matrix — and read its Holds column before
  trusting a rule to be mechanically held. **Layer conflict?** → `docs/17` §4.

## Stop and ask the owner before

**Never invent a requirement.** Where docs are missing, ambiguous or contradictory: name the
conflict, state its impact, recommend one option, ask. Silently choosing is the failure this
prevents.

- Anything billable or external-account-shaped (Fly, store accounts, paid APIs).
- Schema or API work outside the current module (Law 9).
- A layer conflict `docs/17` §4 does not resolve.
- A product-shaped finding (missing business rule, UX gap, spec ambiguity) — record it in
  docs/13 or docs/15 first, then continue.
- Committing, pushing a branch, or opening a PR (`/finish` proposes; you approve).
