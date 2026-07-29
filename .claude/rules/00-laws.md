# The Laws (docs/17) — one line each

1. **Foundation before features.** Feature modules build only on landed foundation.
2. **Architecture is fixed; features extend, never redefine.** New pattern → ADR first.
3. **Contracts before code.** requirements → domain model → API contract → shared types →
   migration → implementation → verification → docs. Never in reverse.
4. **Single source of truth.** Business enums/validation → contracts. Visual values →
   tokens (generated). Schema → docs/04 + migrations. i18n → the one catalog.
   Duplicate definitions are defects, not conveniences.
5. **Reuse before creation.** Search the component indexes and contracts first. Creating
   what exists is a defect. Unmocked surfaces are COMPOSED from existing vocabulary.
6. **Requirement traceability.** Every slice traces to a D-decision, a mockup filename,
   and a module-roadmap task.
7. **Cross-platform lockstep.** Web + RN in the SAME slice from the same contract.
   Exceptions require an owner ruling recorded in the module roadmap.
8. **Documentation is code.** A change that invalidates a doc updates it in the SAME commit.
9. **Incremental schema & API growth.** Tables, enums, columns, contracts and endpoints are
   authored only when their OWNING module's slice begins. docs/04 is frozen DESIGN, not a
   build order. Asked to "implement the schema" → implement the CURRENT module's slice.

## Decision hierarchy (conflicts resolve top-down)

1. These Laws → 2. Product requirements (the D-census + docs/15 rulings) →
3. Architecture (ADRs + docs/02 + docs/03) → 4. Shared domain (docs/04 + domain purity) →
5. API contracts (packages/contracts) → 6. UX spec (design/mockups by filename + docs/10
interaction law) → 7. Design system (design/ds-source via packages/tokens + the component
API) → 8. Repo standards (CLAUDE.md + per-package CLAUDE.md) → 9. Implementation.

Never invent at level N what a higher level already defines. Where a cross-cutting rule and
a per-package CLAUDE.md disagree, **the per-package file wins** (it is closer to the code
and has historically always been the accurate one).

## Stop and ask the owner before

- Anything billable or external-account-shaped (Fly, store accounts, paid APIs).
- Schema or API work outside the current module (Law 9).
- Any new architectural pattern, folder category, state approach or dependency category
  (Law 2 — needs an ADR approved before code).
- A conflict between layers that the hierarchy above does not resolve.
- A product-shaped finding (missing business rule, UX gap, spec ambiguity): record it in
  the module roadmap / docs/13 / docs/15 FIRST, then continue.
