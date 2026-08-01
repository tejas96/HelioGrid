# The Laws (docs/17) — one line each

1. **Foundation before features.** Feature modules build only on landed foundation.
2. **Architecture changes at plan time, not mid-diff.** Better fit found while coding → say
   so; never switch silently.
3. **Contracts before code.** requirements → domain model → API contract → shared types →
   migration → implementation → verification → docs. Never in reverse.
4. **Single source of truth.** Business enums/validation → contracts. Visual values →
   tokens (generated). Schema → docs/04 + migrations. i18n → the one catalog.
   Duplicate definitions are defects, not conveniences.
5. **Reuse before creation.** Search the component indexes and contracts first. Creating
   what exists is a defect. Unmocked surfaces are COMPOSED from existing vocabulary.
6. **Requirement traceability.** Every change traces to a D-decision and a mockup filename.
7. **Cross-platform lockstep.** Web + RN in the SAME change from the same contract.
   Exceptions require an owner ruling, recorded where the decision was made.
8. **Documentation is code.** A change that invalidates a doc updates it in the SAME commit.
9. **Incremental schema & API growth.** Tables, enums, columns, contracts and endpoints are
   authored only when their OWNING module's slice begins. docs/04 is frozen DESIGN, not a
   build order. Asked to "implement the schema" → implement the CURRENT module's slice.

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
