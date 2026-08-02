## What changed

Traces to: D<n> · Mockup: `<Name>.dc.html`

<!-- One paragraph of scope and explicit NON-goals. Not a file list — the diff shows that. -->

## Checklist

Delete rows that genuinely don't apply. Law numbers are `.claude/rules/00-laws.md`.

- [ ] `pnpm verify` green (build · lint · boundaries · typecheck · test)
- [ ] **Run-and-look** (`/qa`): behaviour proven on every surface the change reaches, with
      artifacts on disk. Green gates never prove behaviour.
- [ ] **Contract first** (Law 3): the `packages/contracts` diff is in this PR and the
      committed OpenAPI was re-emitted — or: no contract change
- [ ] **Schema**: migration is a NEW append-only file; forward-compat register
      (`docs/forward-compat.md`) re-read and satisfied — or: no schema change
- [ ] **Parity** (Law 7): `check:ui-parity` green. Screen shipping on one platform only —
      say which and why
- [ ] **Flows authored once** (Law 11): what the gates do NOT cover — hook/state naming,
      behavioural guards, loading and offline affordances, msgid identity across platforms
- [ ] **Docs in the same commit** (Law 8): per-package `CLAUDE.md` landmines and `docs/*`
- [ ] Loading / empty / error / offline states · 375 and 1440 · light theme · Hindi render
- [ ] Provenance tier on every user-visible number; money never renders stale; ₹ in Indian
      grouping
- [ ] No orphan screens — every exit wired into a flow that reaches it
- [ ] Business math is shared, not duplicated across web/api/mobile (`packages/domain`)

## Evidence

<!-- Specifics, not adjectives: "browser 375+1440 happy/wrong-code/send-error; iPhone
     relaunch restores session; curl 409 ALREADY_ONBOARDED" — never just "tested".
     Cite `/qa` step IDs and observed values. Say plainly what could NOT be run. -->

## Review findings & known limitations

<!-- What review surfaced that a reviewer should look at, and what is deliberately
     NOT handled yet. Omitting the latter is how reviewers get surprised. -->
