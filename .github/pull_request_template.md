## Module / slice

<!-- MODULE <name> — target days per docs/14 §5. One paragraph of scope + explicit NON-goals. -->

## Checklist (docs/14 §5 template — delete rows that genuinely don't apply)

- [ ] **Contract first**: `packages/contracts` diff is in this PR (the contract diff IS the API review surface)
- [ ] **Schema**: migration is append-only; forward-compat register row re-read and satisfied
- [ ] **Domain purity**: business math only in `packages/domain`, contexts injected
- [ ] **Lockstep**: web AND RN surfaces ship in this slice (module has a mobile surface)
- [ ] `pnpm turbo typecheck lint test build` green locally
- [ ] **Run-and-look**: verified in the browser AND on both simulators (screenshots below)
- [ ] Loading / empty / error / offline states · 375px · light theme · Hindi render
- [ ] Provenance tier on every user-visible number; money never renders stale
- [ ] No orphan screens — wired into the flows that reach it
- [ ] Docs updated in the SAME PR when a convention changed (per-package CLAUDE.md, docs/*)

## Verification evidence

<!-- curl output / screenshots (1440 + 375 + both simulators) / invariant run -->
