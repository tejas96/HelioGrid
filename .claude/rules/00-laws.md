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

## Decision hierarchy

Defined once, in **docs/17 §4** — read it when layers actually conflict. Never invent at
level N what a higher level already defines. Two tiebreakers that live only here: where a
cross-cutting rule and a per-package CLAUDE.md disagree, **the per-package file wins** (it
is closer to the code and has always been the accurate one); where a doc and a dated ADR
disagree, **the ADR wins**.

## Working principles (every change, not only slices)

- **Architecture first.** Before writing code, name the affected modules, the dependency
  direction, the shared contracts, the ownership boundary, and the scalability and
  backward-compatibility impact. If the change would violate the architecture, STOP and
  explain — never paper over an architectural problem with a local workaround.
- **Shared before local.** Ask "can this be shared?" BEFORE writing it, not after.
  Business logic duplicated across web, mobile and api is forbidden without an explicit
  owner ruling. (Law 5 says reuse what exists; this says put new shared things in the
  shared package.)
- **Minimize blast radius.** A change touches the fewest files that can carry it. If
  something small requires edits across many unrelated files, the architecture is wrong —
  say so before proceeding.
- **No temporary code.** No TODO implementations, no placeholder logic, no "clean this up
  later". Production quality unless the owner explicitly asked for a stub — and then the
  roadmap task records that it is one.
- **Self-review before calling anything done.** Re-read your own diff as a reviewer would:
  architecture · duplication · naming · readability · edge cases · security · performance ·
  accessibility · future extensibility. Fix what you find before presenting the result.
  /lenses does this formally for slices; do it informally for everything else.

## Stop and ask the owner before

**Never invent a requirement.** Where documentation is missing, ambiguous or
self-contradictory: name the conflict, state its impact, give the options, recommend one,
and ask. Silently choosing an implementation is the failure mode this prevents.

Always stop for:

- Anything billable or external-account-shaped (Fly, store accounts, paid APIs).
- Schema or API work outside the current module (Law 9).
- Any new architectural pattern, folder category, state approach or dependency category
  (Law 2 — needs an ADR approved before code).
- A conflict between layers that the hierarchy above does not resolve.
- A product-shaped finding (missing business rule, UX gap, spec ambiguity): record it in
  the module roadmap / docs/13 / docs/15 FIRST, then continue.
