# Design — auth teardown to greenfield + `@heliogrid/data`, the frontend SDK

Status: approved design, not yet implemented · 2026-08-01

## Why

Two problems, one change.

**The frontend data layer is authored twice.** `apps/web/lib/api-client.ts` and
`apps/mobile/src/data/api-client.ts` both call `initClient`. `apps/web/lib/auth-client.ts`
and `apps/mobile/src/auth/client.ts` both build a Better Auth client. Only `apps/mobile`
has repository interfaces; web has none. Error handling exists on web (`envelopeMessage`)
and not on RN. Every one of these is a Law 4 duplicate waiting to drift, and the
forward-compat register's `mobile` row — *"ALL data access behind repository interfaces —
Day 17 swap is a data-layer change only"* — is satisfied on one platform out of two.

Today there are **five** call sites. After the CRM module there will be fifty. This is the
cheapest hour this refactor will ever cost.

**Auth is being rebuilt on a new architecture.** The owner's ruling (2026-08-01) is to
remove it completely first — backend, contract, database, client — keeping only the screens
and the login policy, and to re-integrate Better Auth in a separate session against the
session interface this design defines.

## Owner rulings recorded in this session (2026-08-01)

1. **Auth is removed, not relocated.** Backend integration, contract routes and client code
   all go. Re-integration is a different plan and a different session.
2. **Both platforms' designs survive untouched.** Every screen, component, stylesheet and
   token stays. The login policy in `@heliogrid/domain` stays.
3. **Full database reset**, overriding the append-only migration law in CLAUDE.md §6. True
   greenfield: migrations `0001`–`0006` and the entire drizzle schema are deleted.
   `packages/db` keeps only `client.ts`, `migrate.ts`, `uuid.ts`.
4. **Login protocol constants move to `@heliogrid/domain`**, joining the login policy.
   Contracts may import domain; domain may never import contracts.
5. **Screens get a local walkthrough stub**, not a fail-closed seam — every step of both
   designs stays walkable and screenshot-verifiable in `/qa`.
6. **The ADR process is followed.** New ADRs are written; superseded ones are marked.

Ruling 3 is the one that breaks an existing law. It is recorded here, in docs/15 and in
ADR-0024 so the gate change is traceable rather than silent.

## Shape

```
Screen  →  useSession() / use<Thing>()   ← @heliogrid/data/react   (React Query adapter)
                     ↓
              Repository                 ← @heliogrid/data          (framework-free)
                     ↓
              ts-rest client             ← ONE initClient call in the repo
                     ↓
              Transport                  ← headers · cookies · retry · logging · tracing
                     ↓
              apps/api
```

Two entry points, and that split is the whole design:

- `@heliogrid/data` — repositories, transport, client, errors, types, `createDataLayer`.
  Knows nothing about React. Usable from a Next server component or a script.
- `@heliogrid/data/react` — the React Query adapter and `<DataProvider>`. Replacing React
  Query touches only this directory; no repository and no screen changes.

## Phase A — teardown

### A1 · `packages/db` → greenfield

**Delete:** `migrations/0001_foundation.sql` · `0002_identity_completion.sql` ·
`0003_tenant_scope_global_uniques.sql` · `0004_login_roles.sql` · `0005_force_rls.sql` ·
`0006_admin_role_privileges.sql` · `src/schema/enums.ts` · `identity.ts` ·
`identity-completion.ts` · `platform.ts` · `index.ts`.

**Modify:** `src/index.ts` drops `export * as schema` · `drizzle.config.ts` drops the schema
glob · `packages/db/CLAUDE.md`.

**Keep:** `client.ts`, `migrate.ts` (the advisory-lock + sha256 ledger machinery is correct
and outlives the reset), `uuid.ts`.

Verify: `pnpm --filter @heliogrid/db build && pnpm --filter @heliogrid/db migrate` against a
live database completes with zero migrations applied and no error.

### A2 · `tests/invariants` — honest, not vacuous

With zero tables, `table-tenancy-scan`, `enum-parity` and `schema-parity` pass by having
nothing to compare, and `tenancy-rls` breaks outright — it seeds `tenants`/`users` at
`tenancy-rls.ts:66-70`.

**Modify:** `src/tenancy-rls.ts` — remove the seeded behavioural block; keep the catalog
assertions, which are table-count-driven and correct at zero. `src/run.ts` — when the
database reports zero application tables, print
`INVARIANTS VACUOUS: 0 application tables — tenancy is UNPROVEN until the auth/tenancy
rebuild lands` and still exit 0.

This matters because a green invariant run currently reads as "tenancy is proven". After
the reset it is not, and the banner is what stops that from being a silent lie.

Verify: `pnpm turbo test` with `DATABASE_URL` set prints the banner and exits 0.

### A3 · `packages/contracts`

**Delete:** `src/auth.ts` · `src/ports/session.ts`.

**Modify:** `src/index.ts` — root router becomes `{ health: healthContract }`; drop the
`./auth` and `./ports/session` re-exports. `src/common.ts` — delete `sessionClaimsSchema`
and `tenantClaimSchema` only (both exist solely for the session guard). Everything else in
`common.ts` stays: it is frozen design surface with no auth dependency, and trimming it
would be churn beyond the request.

**Re-emit** `openapi/openapi.json` through the `/contract-change` skill.

Verify: `pnpm check:openapi` byte-compares green; `pnpm turbo typecheck` green.

### A4 · `apps/api`

**Delete:** `src/modules/auth/` (all 10 files) · `src/common/guards/session.guard.ts` ·
`src/common/decorators/current-claims.decorator.ts` · `src/common/decorators/public.decorator.ts` ·
`src/common/tokens.ts` (its only content is `SESSION_RESOLVER`) · `src/scripts/auth-migrate.ts`.

**Modify:** `src/app.module.ts` — drop the `AuthModule` import and the `APP_GUARD`
provider; `HealthModule` stands alone. `src/main.ts` — drop `toNodeHandler`, the `AUTH`
injection and the `/api/auth/*` raw-stream branch; restore plain `bodyParser` (the
`bodyParser: false` + manual `express.json` dance exists only for Better Auth).
`package.json` — drop the `better-auth` dependency and the `auth:migrate` script.
`apps/api/CLAUDE.md`.

**Keep:** `common/db/tenancy-precondition.ts` — it asserts the runtime role cannot bypass
RLS by inspecting role privileges, not tables, so it is correct against an empty database
and must survive to protect the rebuild.

Also drop Better Auth's own tables from any live database (`user`, `session`, `account`,
`verification`, organization tables). They were created by its migrator, never by
`packages/db`, so there is no migration to write — a manual `drop table` in dev.

Verify: `pnpm --filter @heliogrid/api build && start` boots; `curl` on the health route
returns 200; `curl` on any `/api/auth/*` path returns 404.

### A5 · `packages/env` + `.env.example`

**Modify:** `src/schema/api.ts` — delete `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`,
`MSG91_AUTH_KEY`, `MSG91_OTP_TEMPLATE_ID`. `.env.example` — delete the *Auth* block
(lines ~60–64) and the `auth:migrate` references in the header comment (lines ~5, 13, 17, 19).

Verify: `pnpm check:env` green; the api boots with those variables absent from `.env.local`.

### A6 · `@heliogrid/domain` gains the protocol constants and the tenant segment

**Add:** `src/auth/otp.ts` with `OTP_LENGTH = 6`, `OTP_EXPIRY_SECONDS = 300`,
`PHONE_NSN_LENGTH = 10`, `COUNTRY_CALLING_CODE = '+91'` — values unchanged, moved verbatim.

**Add:** `src/tenancy/segment.ts` with `TENANT_SEGMENTS = ['residential','ci','both'] as const`
and `TenantSegment = (typeof TENANT_SEGMENTS)[number]`. Domain has no zod (it is
dependency-free by law), so the canonical form is the readonly tuple and contracts rebuilds
`z.enum(TENANT_SEGMENTS)` from it later. `OnboardingScreen.tsx` iterates `TENANT_SEGMENTS`
where it iterated `tenantSegmentSchema.options`; its `Record<TenantSegment, string>` label
map is unchanged, so the landmine it was written for still holds.

**Modify:** `src/index.ts` to export both.

**Consumers found by grepping call sites (not declarations) — all must be repointed:**
`packages/ui/src/composites/OtpInput.tsx` · `apps/mobile/src/ui/composites/OtpInput.tsx` ·
`apps/web/features/auth/login/components/PhoneStep.tsx` ·
`apps/mobile/src/screens/login/components/OtpStep.tsx` · both `use-login.ts` ·
`apps/web/features/auth/onboarding/OnboardingScreen.tsx` · `use-onboarding.ts`.

Note `packages/ui` therefore gains a `@heliogrid/domain` dependency. The turbo `ui` boundary
tag already allows `domain`, so no gate changes.

**Stays in contracts, untouched:** `uiLanguageSchema` (consumed by `packages/i18n`),
`workflowStatusSchema` (consumed by both design systems and both galleries), `Liveness`.

This is the pattern the package header already declares: *"A business enum both layers need
is defined here as a pure union and contracts builds its `z.enum` from it"* (owner ruling
2026-07-30). When the wire is rebuilt, `packages/contracts` imports these from domain — one
definition, correct direction, no re-authoring.

Verify: `pnpm turbo typecheck` green across all packages; both login screens still render
six OTP boxes and a ten-digit phone field.

### A7 · `apps/web`

**Delete:** `lib/auth-client.ts` · `lib/api-client.ts` (superseded by `@heliogrid/data`).

**Modify:**
- `features/auth/login/hooks/use-login.ts` — `authClient.phoneNumber.sendOtp/verify`
  become `session.requestOtp/verifyOtp`. The state machine, timers, `otpEpoch` remount,
  auto-verify delay, resend countdown and every error branch are untouched.
- `features/auth/onboarding/hooks/use-onboarding.ts` — the `completeOnboarding` mutation
  becomes a local advance to `/home`; the enum-driven segment state stays exactly as it is.
- `features/home/hooks/use-home.ts` — `api.auth.me` / `api.auth.listTeam` are gone. Reads
  `session.user` for name, phone and tenant; the team section renders its existing empty
  branch (*"Just you so far"*). No redirect rules until the rebuild owns them again.
- `app/providers.tsx` — `QueryClient` construction moves into `<DataProvider>`; the file
  wires `createDataLayer({ baseUrl: API_URL })` and keeps the i18n/locale context as is.
- `package.json` — drop `better-auth`, `@ts-rest/core`, `@ts-rest/react-query`; add
  `@heliogrid/data`. **`@tanstack/react-query` and `react` stay** — they satisfy the new
  package's peer dependencies, and dropping them would leave the peer unmet.
- `apps/web/CLAUDE.md` — the `lib/` convention and the "never hand-roll fetch" landmine now
  point at `@heliogrid/data`.

**Keep:** `lib/env.ts` (still the literal `NEXT_PUBLIC_*` read), every screen, every `.css`,
the static `/signup` placeholder, `/design` and `/design/gallery`.

Verify: `/login` walks phone → OTP → done in the browser; `/onboarding` submits; `/home`
renders the greeting; `/design/gallery` unchanged; First Load JS per route not worse than
today.

### A8 · `apps/mobile`

**Delete:** `src/auth/client.ts` (the cookie jar goes with Better Auth) · `src/data/api-client.ts` ·
`src/data/repositories.ts` — the `src/data/` directory is removed entirely.

**Keep:** `src/auth/keychain-storage.ts` — it becomes the app's `TokenStorage`
implementation, which is exactly the one thing that should stay platform-side.

**Modify:**
- `src/screens/login/hooks/use-login.ts` — same substitution as web, same state machine.
- `src/navigation/RootNavigator.tsx` — the session gate reads `useSession().status`
  instead of `api.auth.me.query()`. Both stacks stay reachable.
- `App.tsx` — mounts `<DataProvider>` with
  `createDataLayer({ baseUrl: API_URL, storage: keychainStorage })`.
- `package.json` — drop `better-auth`, `@ts-rest/core`, `@ts-rest/react-query`; add
  `@heliogrid/data`. **`@tanstack/react-query` and `react` stay** (peer dependencies of the
  new package). **Keep the explicit `zod` 3.25.76 pin.**
- `apps/mobile/CLAUDE.md` — the closed `src/` set becomes `{auth,navigation,push,screens,ui}`;
  the repository landmine points at `@heliogrid/data`; the cookie-jar landmine is removed.

Verify: both simulators boot; login walks phone → OTP → done on each; gallery unchanged.

### A9 · Cross-cutting

- `scripts/check-adherence.sh` — the `COPY_DEBT` allowlist names `HomeScreen.tsx` and
  `OnboardingScreen.tsx`. Both screens survive, so both entries stay; only the written
  reason is updated to cite this teardown instead of "rebuilt with auth (ruling 6)".
- i18n — run `lingui extract`; the CI catalog-diff gate fails otherwise.
- `knip` — sweep for exports orphaned by the deletions.

## Phase B — `packages/data`

```
packages/data/
├── src/
│   ├── index.ts                 createDataLayer · DataLayer · re-exported types
│   ├── react/
│   │   ├── index.ts             the ONLY React entry
│   │   ├── provider.tsx         <DataProvider> — owns the QueryClient and its defaults
│   │   └── context.ts           useRepositories · useSession
│   ├── transport/
│   │   ├── storage.ts           TokenStorage port — interface only
│   │   └── transport.ts         createTransport
│   ├── client/client.ts         the ONE initClient call
│   ├── errors/errors.ts         ApiError · UnauthorizedError · toApiError
│   ├── cache/keys.ts            queryKeys
│   ├── data-layer.ts            createDataLayer · DataLayer · Repositories
│   ├── health/repository.ts     HealthRepository interface + online impl
│   └── session/
│       ├── types.ts             SessionStore · SessionApi · SessionUser · OtpResult
│       └── walkthrough.ts       the deliberate stub
├── package.json · turbo.json · tsconfig.json · CLAUDE.md
```

Organisation is feature-first (`health/`, `session/`) beside the infrastructure folders,
matching the repo's existing naming law: a feature is named for the capability it owns and
that name spans `apps/api/src/modules/<m>`, `apps/web/features/<f>` and this package.

**One deliberate exception: every React hook lives under `src/react/`, not beside its
repository.** Colocating `health/hooks.ts` with `health/repository.ts` would read better,
but then the `data-core-is-framework-free` rule needs a filename pattern rather than a
directory prefix — and docs/17 is explicit that a fuzzy mechanism rots. A crisp lint rule
beats colocation here. With `use-health.ts` and `use-session.ts` it is two files.

**Session is a store, not a plain object.** `SessionStore` exposes
`subscribe(listener) / getSnapshot()` alongside the three calls, so the framework-free layer
holds the state and the React layer reads it through `useSyncExternalStore`. A plain object
with a `readonly status` field could never re-render a screen.

### The interfaces

```ts
// transport/storage.ts — RN only. Web's session is an HttpOnly cookie JavaScript cannot
// read by design; implementing this port there would mean a no-op or worse security.
export interface TokenStorage {
  get(): Promise<string | null>;
  set(value: string): Promise<void>;
  clear(): Promise<void>;
}

// session/types.ts — derived from what the two login controllers actually call today.
export type SessionStatus = 'checking' | 'anonymous' | 'authenticated';
export type OtpResult = { ok: true } | { ok: false; failure: OtpFailure };

export interface SessionUser {
  id: string;
  name: string;
  phoneE164: string;
  /** Null until onboarding completes — the rule both platforms already encode. */
  tenant: { id: string; name: string } | null;
}

export interface SessionSnapshot {
  status: SessionStatus;
  user: SessionUser | null;
}

/** Framework-free. The React layer reads it via useSyncExternalStore. */
export interface SessionStore {
  getSnapshot(): SessionSnapshot;
  subscribe(listener: () => void): () => void;
  requestOtp(phoneE164: string): Promise<OtpResult>;
  verifyOtp(phoneE164: string, code: string): Promise<OtpResult>;
  signOut(): Promise<void>;
}

/** What `useSession()` returns — the snapshot flattened onto the three calls. */
export interface SessionApi extends SessionSnapshot {
  requestOtp(phoneE164: string): Promise<OtpResult>;
  verifyOtp(phoneE164: string, code: string): Promise<OtpResult>;
  signOut(): Promise<void>;
}

// index.ts
export interface DataLayerConfig {
  baseUrl: string;
  storage?: TokenStorage; // RN only
}
export function createDataLayer(config: DataLayerConfig): DataLayer;
```

`OtpResult` returns the failure rather than throwing because both controllers branch on
wrong-code (4xx) versus transport (5xx/offline) today. Putting that distinction in the
return type is what lets typecheck see it, and it maps onto domain's existing `OtpFailure`
union with no new vocabulary.

### The stub, stated plainly

`session/walkthrough.ts` exports `createWalkthroughSession()`: it accepts any correctly
shaped phone number and any six-digit code, returns a fixed walkthrough user, and reaches no
server. **It is a deliberate stub, authored once so neither app invents its own, and it is
deleted in the auth rebuild.** Its file header says exactly that. It exists for one reason:
the owner chose to keep both platforms' login designs verifiable while the backend is absent.

### Dependencies

`@ts-rest/core` 3.52.1 · `zod` 3.25.76 (**pinned explicitly** — without it pnpm resolves
ts-rest's peer to the transitive zod 4 and the typed client collapses to `never`, hit
2026-07-27) · `@heliogrid/contracts` · `@heliogrid/domain`. React and
`@tanstack/react-query` 5.101.4 are peer dependencies, used only under `src/react/`.
`@ts-rest/react-query` is dropped from the repo entirely — the core client plus a
hand-written adapter is what makes the adapter swappable.

## New gates

Added to `.dependency-cruiser.cjs`, all severity `error`:

| Rule | Stops |
|---|---|
| `data-lean` | `packages/data` importing `db`/`ui`/`ui-api`/`tokens`/`i18n`/`adapters`/`apps` — the God-package failure mode, held structurally rather than by prose |
| `data-core-is-framework-free` | anything under `packages/data/src/` outside `src/react/` importing `react` or `@tanstack/react-query` — this *is* the adapter boundary |
| `apps-never-touch-the-wire` | `apps/web` and `apps/mobile` importing `@ts-rest/*` or `better-auth` directly |
| `package-index-only` (extend) | deep imports into `packages/data/src/**` other than `index` and `react` |

Plus `packages/data/turbo.json` with `tags: ["data"]` and the matching boundary entry, and a
new row per rule in the docs/17 §5 matrix.

The third rule is the important one. The source discussion's own conclusion was that this
architecture survives only if nobody calls the client directly "just this once". Here that
is a build failure, not a discipline problem.

## Documentation (Law 8 — same change, not a follow-up)

- **ADR-0023** — `packages/data`, the frontend SDK: two entry points, repository interfaces,
  the React Query adapter boundary, RN-only `TokenStorage`.
- **ADR-0024** — auth removal to greenfield: records ruling 3 and its
  cost (the invariants are vacuous until the rebuild).
- **ADR-0010** — already deleted by the owner in `ef7554c` (2026-08-01 22:52), together with
  0002, 0006, 0014, 0016, 0020 and 0022. That commit also rewrote `docs/adr/README.md` to
  say ADRs are reference-only and that replaced architecture DELETES the old file and its
  row, so there is nothing to mark superseded. ADR-0024 records the teardown's consequences
  rather than the old decision.
- **docs/15** — the append-only override as a dated owner ruling.
- **docs/02** — `packages/data` in the package list and the dependency-direction paragraph.
- **docs/17 §5** — one matrix row per new gate.
- **docs/14** — Track A status reflects the teardown.
- **docs/forward-compat.md** — the `mobile` row is now satisfied by `packages/data` for
  both platforms, not by `apps/mobile` alone.
- **README**, root **CLAUDE.md** §9, `apps/web/CLAUDE.md`, `apps/mobile/CLAUDE.md`,
  `packages/db/CLAUDE.md`, and a new `packages/data/CLAUDE.md` on the docs/17 Appendix A
  template.

## Deliberately different from the source discussion

1. **Auth is removed, not replaced.** The source pairs teardown with re-integration; the
   owner split them.
2. **`contracts` and `domain` are not untouched.** The source says "keep, no change in
   responsibility". The chosen teardown deletes `contracts/src/auth.ts` and moves four
   constants into domain.
3. **The source's Phase 3, "align NestJS with contracts", is a no-op.** `apps/api` is
   already Controller → Service → Repository with both boundaries lint-enforced.
4. **`TokenStorage` is RN-only, not cross-platform.** Correcting the source: web's session
   is an HttpOnly cookie that JavaScript cannot read, so the port is optional.
5. **Web has two consumption paths, not one.** `@heliogrid/data/react` is client-only;
   server components and route handlers use the framework-free entry. The two-entry split
   already accommodates this; naming it here stops it being a later surprise.
6. **Feature flags are rejected.** They appear in the source's "must support" list;
   CLAUDE.md §7 says entitlements are the only gating. (ADR-0016 stated the same and was
   deleted in `ef7554c`; the rule itself is unaffected — it lives in the constitution.)

## Out of scope

Better Auth re-integration · any `SessionApi` implementation beyond the walkthrough stub ·
re-authoring migrations (the auth/tenancy module owns the new `0001` under Law 9) ·
restoring tenancy proof in the invariants · new product endpoints · any change to the design
system, tokens, `packages/ui`, `packages/ui-api` or either platform's screens beyond the
controller substitutions listed in A7 and A8.

## Definition of done

`pnpm verify` green repo-wide · `pnpm check:openapi` green · `pnpm check:env` green ·
`lingui extract` produces no catalog diff · both simulators walk login end to end · the
browser walks `/login`, `/onboarding`, `/home` and `/design/gallery` · `/qa` evidence
committed under `.qa/<run-id>/` · every document listed above updated in the same change.
