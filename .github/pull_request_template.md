## What changed

Roadmap task: `docs/modules/<module>.md` #<N> · Traces to: D<n> · Mockup: `<Name>.dc.html`

<!-- One paragraph of scope and explicit NON-goals. Not a file list — the diff shows that. -->

## Checklist

Delete rows that genuinely don't apply. Law numbers are `.claude/rules/00-laws.md`; the
roadmap and status rules are docs/17 §3.

- [ ] `pnpm verify` green (lint · boundaries · typecheck · test · build)
- [ ] **Run-and-look**: verified in the browser AND on both simulators for UI; curl/logs for
      api/worker. Green gates never prove UI work.
- [ ] **Contract first** (Law 3): the `packages/contracts` diff is in this PR and the
      committed OpenAPI was re-emitted — or: no contract change
- [ ] **Schema**: migration is a NEW append-only file; forward-compat register
      (`docs/modules/forward-compat.md`) re-read and satisfied — or: no schema change
- [ ] **Lockstep** (Law 7): web AND RN ship in this slice — or an owner ruling recorded in
      the module roadmap
- [ ] **Docs in the same commit** (Law 8): per-package `CLAUDE.md` landmines, `docs/*`, and
      the roadmap row
- [ ] Loading / empty / error / offline states · 375 and 1440 · light theme · Hindi render
- [ ] Provenance tier on every user-visible number; money never renders stale; ₹ in Indian
      grouping
- [ ] No orphan screens — every exit wired into a flow that reaches it
- [ ] Business math is shared, not duplicated across web/api/mobile (`packages/domain` once
      it lands)

## Evidence

<!-- Specifics, not adjectives: "browser 375+1440 happy/wrong-code/send-error; iPhone
     relaunch restores session; curl 409 ALREADY_ONBOARDED" — never just "tested".
     A VERIFIED roadmap row says what was run, on what surface, and what was seen. -->

## Review findings & known limitations

<!-- What the five lenses surfaced that a reviewer should look at, and what is deliberately
     NOT handled yet. Omitting the latter is how reviewers get surprised. -->
