# ADR-0021 — packages/domain: the pure isomorphic domain layer

**Status:** Accepted (owner approval 2026-07-29)
**Date:** 2026-07-29

## Context

The original architecture (BLUEPRINT, now archived; docs/02) specified
`apps/* → packages/contracts → packages/domain` with `domain` as pure isomorphic TypeScript.
The package was never created. Eleven references treat it as load-bearing anyway: two
dependency-cruiser purity rules that match nothing, the `domain` turbo boundaries tag, and
five per-package CLAUDE.md files stating that business logic and shared formatters "belong
to packages/domain".

Meanwhile domain behaviour accumulated where it could: invite TTL and token hashing, the
redemption state machine and the LAST_OWNER invariant live in `apps/api` services, and the
login flow state machine is implemented **twice** — once in `apps/web/app/login/page.tsx`
and once in `apps/mobile/src/screens/login/LoginScreen.tsx` — with measurable behavioural
drift between them (done-step dwell 1400ms vs 900ms, `navigator.onLine` vs local state for
offline, and differently shaped failure unions).

Web and React Native must ship the same behaviour from the same slice (Law 7). Two
hand-maintained copies of a state machine cannot satisfy that, and every future flow
(signup, invite accept, each CRM screen) would replicate the pattern.

## Decision

Create `packages/domain` as pure isomorphic TypeScript.

**It may import:** nothing but the TypeScript standard library and `packages/contracts`
**types**.

**It may never import:** NestJS, React, React Native, any storage, any fetch client, any
environment read, `packages/db`, `packages/ui`, or any app. Rules, catalogs and market
configuration are **injected parameters, never module-level globals** — the POC's
`resolveRules()` singleton is the anti-pattern this rule exists to prevent.

Intended contents:

1. Shared formatters — ₹ Indian grouping (`formatInr`) and E.164 phone display.
2. The invite and role invariants currently embedded in `apps/api` service code.
3. The login flow state machine as a pure reducer, consumed by both platforms.

**The package lands empty of behaviour** (owner decision 2026-07-30). Item 3 was to be its
seed, but the auth module is being rebuilt from scratch (auth-tenancy ruling 6) and the
router for both platforms is being set up first — extracting a machine out of login screens
that are about to be deleted would be refactoring code with no future. It arrives with the
auth rebuild instead. Items 1–2 land with the first slice that needs them, under Law 9's
"author it when its owning module's slice begins".

Creating the package now rather than with its first occupant is deliberate: the eleven
references already exist and the two purity rules are inert until the directory does, so
today a green cruise proves less than it appears to.

## Consequences

- The two dependency-cruiser purity rules become live and meaningful. Until now they targeted
  a path that matched nothing, so they could never fail. Both were proven to fire on the day
  this package landed, and proving them exposed two things worth recording:
  - **An unresolvable import is invisible to the cruiser.** `import '@nestjs/common'` inside
    `packages/domain` passes the cruise, because the package is not a dependency, so no
    dependency edge exists to match. The rules catch what the code can actually reach — which
    is the honest scope, but it means "green" never proves "nobody tried".
  - **`dependencyTypes: ['npm']` covers production dependencies only.** A `react`
    *devDependency* import passed clean until both rules were widened to
    `['npm', 'npm-dev']`. That mattered here because this package ships SOURCE
    (`main` → `src/index.ts`), so a devDependency import reaches consumers exactly like a
    production one. The same widening was applied to `no-raw-http-clients` (ADR-less, rule 20),
    which had the identical hole.
- The eleven dangling references resolve.
- Platform-specific concerns (timers, navigation, storage, rendering) stay in the apps; only
  the decision logic is shared. This is deliberate — a shared *renderer* would require
  react-native-web and would break the bare-RN and pixel-fidelity constraints (ADR-0011).
- New domain logic has an obvious home, which is what stops it accreting in service classes.
- An empty package is a real (small) cost: it is a workspace member, a turbo node and a
  tsconfig reference that carry no behaviour yet. Accepted, because the alternative is
  landing the purity rules at the same moment as the first behaviour they must police.

## Rejected alternatives

- **Delete the eleven references instead.** Cheaper today, but leaves the login drift with
  nowhere to go and every future flow repeating it.
- **Share via `packages/contracts`.** Contracts is the wire format; putting behaviour there
  would couple the API surface to client state machines.
- **A shared component/renderer layer (react-native-web, Tamagui).** Conflicts with bare RN
  (ADR-0011) and with pixel fidelity to the design system. A true rebuild for marginal gain.
- **Wait for the auth rebuild and create it then.** Would keep the purity rules inert through
  the router work, and leaves five CLAUDE.md files pointing at something that does not exist.
