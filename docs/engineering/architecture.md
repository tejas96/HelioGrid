# HelioGrid architecture — the spine

The single canonical home for inter-package facts: what each package owns, what it may
depend on, its platform scope, and where new code goes. Other documents POINT here; none
restates it.
This file states POLICY. The current dependency graph lives in package.json files;
enforcement lives in .dependency-cruiser.cjs (import rules and cycles) and Turbo
Boundaries (package declarations and role tags) — each authoritative within its own
concern. Anything describing unbuilt design carries a STATUS banner.

## §1 Module map & dependency direction

Layers, top to bottom — imports point strictly downward:

    apps (web · mobile · api · worker)  +  tests/invariants
      ↓
    feature-facing packages: data · forms · i18n · ui
      ↓
    foundation packages: contracts · domain · theme · db · env
      ↓
    config

- Packages NEVER import apps. Imports point downward, or WITHIN a layer where a §2 block
  declares the edge (contracts → domain is legal and intra-layer).
- The only wire path for frontend apps is @heliogrid/data (ADR-0023) — the sole
  initClient call in the repo lives there.
- db is backend-only. The uuid subpath is consumed by the backend (repositories, common/db);
  the Node-only frontend exemption is retired — no app ever imported it.
- **A §2 block is the policy; it is not a claim that something enforces it.** dep-cruiser
  holds import rules and cycles; Turbo Boundaries holds package declarations and role tags.
  Each gate is authoritative within its own scope, not across both. A passing gate proves
  nothing outside its concern.

## §2 Package registry

Every block carries seven fields: **purpose** (the heading) · **owns** · **allowed deps**
(policy — the workspace packages it MAY import) · **never** · **platform scope** ·
**belongs/never here** · **extension point**. A block missing one is incomplete. Anything
not built yet carries a STATUS line, per this file's header.

**When a NEW package is justified — the four triggers.** Splitting is not free: every package
is a build edge, a `dist/` to rebuild, an `exports` map to keep honest, and one more hop
between a reader and the code. Split ONLY for:

1. **Incompatible runtime dependencies** — the halves cannot share one dependency set (a
   Node-only server entry beside a bundle that must never see `node:*`).
2. **Independent bundling or deployment** — one half must be reachable without pulling the
   other in (why `@heliogrid/i18n` publishes `./rn` separately: importing it installs global
   Intl polyfills that must never enter a web bundle).
3. **Measured build cost** — a rebuild time you have actually recorded, not one you expect.
4. **Stable independent ownership** — a different team or release cadence, sustained, not
   anticipated.

**Folder size is NOT a trigger.** A large package with a coherent purpose is healthier than
two packages joined by a cycle. If a split would need both halves to import each other, the
boundary is in the wrong place — move the shared fact down a layer instead (§1).

### config — shared tsconfig presets
Owns: the shared compiler options (`tsconfig/base.json`) and the presets that extend them
(node-package, nest-app) — nothing else. The repo-root `tsconfig.base.json` extends this
package's `base.json`, not the other way round: **every `extends` inside this package must be
package-relative.** A consumer reads these files through `node_modules/@heliogrid/config/`, a
pnpm symlink, so a path climbing out of the package resolves to
`packages/<consumer>/node_modules/` for any tool that does not realpath first. `tsc` does
realpath, which hid this for months; Vite's transform does not, and no unit test in the repo
could compile until it was fixed (2026-09-03). Allowed deps: none.
Platform scope: all. Belongs: a new compiler preset. Never: a comment — Biome parses these as
strict JSON, so the reason lives here; runtime code, lint config
(biome.json is root-owned). Extension point: a new preset per new runtime class. A package with no matching preset
extends `tsconfig.base.json` directly; apps/mobile extends `@react-native/typescript-config`
and hand-mirrors the base strictness flags (`packages/config/CLAUDE.md`).

### env — the only raw environment reader
Owns: env schemas + loaders (server/web/native); the .env.example contract. Allowed deps:
config. Platform scope: shared (per-runtime entry points). Belongs: every new variable, as
a schema edit + .env.example line. Never: business logic; a raw process.env read outside the
audited allowlist — `scripts/check-env-access.mjs`'s ALLOWED array is the authority and
carries each exception's reason (do not "fix" an entry you find there). Extension point: a
new loader per new runtime.

### contracts — the wire truth
Owns: ts-rest routers, request/response Zod schemas, wire enums, the error envelope, the
UI language identity (locale.ts — UI_LANGUAGES/UI_SOURCE_LOCALE/uiLanguageSchema, its own
file because packages/i18n and the Lingui CLI config read it, and a locale list reached for
through a grab-bag of pagination schemas is how a second list gets written), and
Temporal workflow messages (`workflows/`, published as the `./workflows` subpath — a
process-to-process contract that must never reach the OpenAPI artifact or a frontend
bundle). Emits the committed
openapi/openapi.json, gated by scripts/check-openapi-breaking.mjs. Also owns the HelioGrid
SESSION PROJECTION (session.ts — actor, membership with its held roles and authorization
version, expiry) so replacing the identity provider changes no guard, repository, screen or
contract. Allowed deps: domain (LIVE since 2026-08-25 — rolePresetSchema is
z.enum(ROLE_PRESETS) built from domain's tuple), config. Platform
scope: shared. Belongs: anything crossing HTTP. Never: tenant identity on the wire
(`packages/contracts/CLAUDE.md` carries the rule and its invariant);
implementation; storage shapes. Extension points: a feature module mounts its router into
apiContract (Law 3: contract before implementation); ports/<capability>.ts lands with its
consumer, EXCEPT where the port is the thing its consumer must be BUILT AGAINST —
ports/session.ts was authored ahead of its guard (Track 5a, 2026-08-25) because a session
projection invented alongside its first handler is a projection shaped by that handler, and
because a guard depending on an interface rather than a service class is what stops it
failing at boot in the declaring module's injector.

### domain — pure business truth
Owns: business logic, policy numbers, protocol constants, formatters, flow view-model
types shared by platforms (Law 11), and the AUTHORIZATION POLICY — the twelve preset roles,
the capability matrix, and the OR-across-roles / widest-wins-per-domain resolution
(`src/authz/`, F2). Allowed deps: config. Platform scope: shared, pure TS
— no react, no node builtins, no clock/randomness/I-O (domain-purity gates). Belongs: a
constant two screens read; a flow state machine; a permission rule. Never: fetch, storage,
rendering; a session, a tenant or a request (the API resolves those and passes roles IN).
Extension point: one folder per module slice (authz/, auth/, tenancy/, format/, market/ today); each
module appends its own capability rows when its slice begins.

### db — schema mirror, migrations, backend client
**STATUS: greenfield.** `src/schema/` and migrations 0001–0006
were deleted; the auth + tenancy slice re-authors them and the next migration is a fresh
0001. Today the package is client.ts + migrate.ts + uuid.ts.
Owns: append-only migrations and the Drizzle schema mirror (both re-authored per above),
the migrate runner (sha256-locked, advisory-locked), the pool factory `createDb` plus RLS
plumbing (withTenantTransaction, the runtime-role assertion, ping), and the uuid subpath.
The admin/runtime pool PAIR is not here — apps/api constructs it (admin-pool-fenced).
Allowed deps: config. Platform scope: backend only. The ./uuid subpath is for backend use
(repositories, common/db); the Node-only frontend exemption is retired — no app ever
imported it and node:crypto cannot resolve in a browser or Metro bundle.
Belongs: DDL for the current module's slice (Law 9).
Never: contracts imports (db-no-upward — the enum-parity invariant is the seam that keeps
pgEnum ↔ z.enum honest); business logic. Extension point: /migration authors the next
numbered file.

### data — the ONLY frontend wire path (ADR-0023)
Owns: the typed client (sole initClient, response-validating and unknown-status-rejecting),
the one cross-platform transport and its three modes (browser · mobile · request-scoped
server), the stable DataError taxonomy, the internal repository registry (src/composition.ts),
repositories, session store, and the react-query adapters under src/react/. Allowed deps:
contracts, domain, config. Platform scope: shared frontend (core framework-free; react
confined to src/react/ and src/server/). THREE entry points, all declared in package.json
exports and all named in package-index-only: `.` framework-free · `./react` the React Query
adapter · `./server` one request-scoped context for a Next server render. Belongs: every new
endpoint's repository + hook. Never (all held by data-lean): db (the uuid subpath included), ui, theme, i18n,
adapters, and any app; a second client; platform APIs; a process-global holding credentials
or a QueryClient. Extension point: one repository per contract router, registered in
src/composition.ts.

### forms — the fenced form layer
Owns: useZodForm, applyServerErrors (server VALIDATION_FAILED → field errors), the
translated zod error map (installFormsErrorMap), and the re-exports apps must use instead
of the raw libraries — `z`, Controller/useFieldArray/useWatch and the react-hook-form
types. Allowed deps: config (react-hook-form/zod are its third-party internals).
Platform scope: shared frontend. Belongs: form-state wiring. Never: schemas themselves
(contracts) or copy (i18n). Extension point: new form primitives, exported through the
index only.

### i18n — catalogs, language metadata and the provider
Owns: Lingui catalogs (compiled messages committed), the LANGUAGE_META table and the
catalog loaders (both `satisfies Record<UiLanguage, …>` over the contract's UI_LANGUAGES —
never a second list), the per-mount/per-request runtime and translator factories, the ONE
React provider both platforms use, the Hermes Intl polyfills, and src/copy/ shared-copy
modules (React-free /*i18n*/ descriptors — JSX is banned there for the dual-instance
ESM/CJS hazard). It also owns the @lingui and @formatjs DEPENDENCIES: neither app declares
them. THREE entry points: `.` React-free (createTranslator for a server render or a job) ·
`./react` the provider and hooks · `./rn` the Hermes polyfills, separate because importing
them has global side effects a web bundle must never take. Allowed deps:
contracts, domain (the money/format helpers when domain's money slice lands — the turbo
i18n tag already permits this edge), config; react is a PEER. Platform scope: shared
frontend. Belongs: copy both platforms render (Law 11). Never: macro imports (lint-banned);
a module-scope i18n instance (one shared mutable locale across concurrent server renders);
locale-default number formats for money
(CLAUDE.md §9: tenant-currency grouping — UI LANGUAGE never selects a money format; the
tenant's MARKET does). Extension point: new copy modules keyed by
contract enums where applicable.

### theme — tokens, the semantic layer and the provider
Owns: `src/_generated/` pulled from the LIVE design system (`ds:pull`), the semantic
role mapping, the RN theme registration, the web provider; emits tokens.css + print.css;
the WCAG DECLARED_PAIRS gate. Allowed deps: none at runtime (config dev-only). Platform
scope: shared. Belongs: every visual value. Never: hand-edited `_generated/` (the v1
package was hand-copied and drifted in days — docs/engineering/17 §1); workspace imports. Extension
point: emit targets grow here. Replaces the v1 `tokens` package, deleted 2026-08-19.

### ui — the design system, BOTH platforms  (built ahead of its screens — docs/engineering/17)
Owns: `primitives/` (the ~8 atoms, two of which hold product law — 44px targets and
status-never-by-colour-alone) and `components/<Name>/` where `<Name>.types.ts` is the one
prop contract, `<Name>.tsx` is web and `<Name>.native.tsx` is RN. Allowed deps: contracts,
domain, theme, config. Platform scope: BOTH. Belongs: a new shared visual component — one
folder, three files, one change (Law 7). Never: screens/routes; data access; navigation;
raw colour (adherence gate). Extension point: a folder under `src/components/`.

Replaces the v1 split of `packages/ui` (web) + `apps/mobile/src/ui` (RN) +
a separate types package. That arrangement stated one prop list
three times and needed `check-ui-parity.mjs` to compare them; the shared `.types.ts` makes
divergence a type error instead.

### apps/web — Next.js
Owns: routes (app/ — routing only), features/ (capability owners), web screens, and lib/
(app infrastructure: ApiErrorText + its css, and env.ts — the allowlisted literal
NEXT_PUBLIC_* read; see §2 env). Allowed deps: contracts, data, domain, env, forms, i18n,
theme, ui, config. Platform scope: web (browser + Next server runtime). Belongs: screen
composition, web-only hooks (DOM APIs) under features/*/shared/. Never: db (web-no-db — uuid subpath included), @ts-rest/* or any HTTP client (apps-never-touch-the-wire,
no-raw-http-clients), react-hook-form/zod directly (forms is the fence), RN imports.
Extension point: a new capability is a new features/<capability>/ folder with an index
barrel — app/ may import it only through that barrel
(web-app-imports-feature-barrel-only). Platform rules: §3.

### apps/mobile — React Native
Owns: screens, navigation, native
adapters, and app-level helpers. `src/` is a CLOSED set of folder categories, enumerated in
`apps/mobile/CLAUDE.md`; a new one is a plan-time call. Allowed
deps: contracts, data, domain, env, forms, i18n, theme, ui. Deliberately NOT config
(extends @react-native/typescript-config; hand-mirrors base strictness flags — a new base
flag must be copied here). Note: `config` appears in the Turbo `app-mobile` boundary
allowlist because Turbo traverses transitive workspace devDependencies — env (a direct dep)
declares config as a devDep. No mobile source file may import from config; dep-cruiser
enforces this and config has no runtime exports to import. Platform scope: native only (iOS + Android, bare React Native —
no Expo, no DOM). Belongs: screen composition and the native adapters the screens consume;
anything both platforms need belongs in a package instead (Law 11). Never: a local
component mirror (the RN half lives in @heliogrid/ui as `.native.tsx`), db (mobile-no-db — uuid subpath included),
wire/form internals (same fences as web), expo/EAS/
AsyncStorage (owner rulings). Extension point: a new screen is a new src/screens/<screen>/
folder. Platform rules: §3.

### apps/api — NestJS BFF
Owns: API modules (health today; feature modules land per slice), the Temporal gateway
(common/temporal — the ONE place workflows are started, signalled and queried, every payload
validated against its contract), the ContractException
error envelope, global ts-rest response validation, the request-id seam (common/request-id.ts
— assign before CORS and body parsing, echo on every response, expose through CORS), the
log shape and its redaction (common/logging.ts — the ONE authoring; there is no shared
packages/config/logging.ts), the explicit body limit and its canonical 413, the tenancy
runtime precondition, and the RUNTIME_DB/ADMIN_DB pool pair in
common/db (fenced by admin-pool-fenced — db provides the factory, this app builds the
pair). Allowed deps: contracts, domain, db, env, config (domain consumer is re-added with
the auth rebuild). Platform scope: backend only (Node). Belongs: the HTTP edge and its
repositories. Never: ui/theme/i18n/data (frontend layers — held by the `app-api` Turbo
boundary tag); raw process.env (env owns it). Extension point: one Nest module per contract router,
repositories fenced by db-access-in-repositories-only.

### apps/worker — Temporal workflows and activities
**STATUS: Temporal worker (ADR-0025).** BullMQ was removed in the Track 7 cutover and its
contract export deleted in Track 9; `no-bullmq` makes re-adding it a build failure. One
business area exists (`modules/platform/`) and it is deliberately not a product module — the
cutover proves the path without a product module depending on an unproven mechanism.
Owns: the single Temporal connection and worker lifecycle (common/temporal — graceful drain on
SIGTERM), and one folder per business area under src/modules/<area>/ holding
`<area>.workflows.ts` (DETERMINISTIC — imports nothing from Node, Nest, db, HTTP or env),
`<area>.activities.types.ts` (the seam the workflow types against), `<area>.activities.ts`
(idempotent side effects) and `<area>.public.ts`. The workflow BUNDLE is a build artifact; the
worker refuses to boot without it. Held by: workflows-are-deterministic ·
workflows-take-no-core-modules · temporal-client-fenced · no-bullmq. Allowed deps: contracts, domain,
db, env, config, adapters. Platform scope: backend only (Node, no HTTP surface). Belongs: work that must
outlive a request. Never: HTTP handlers (api owns the edge); frontend layers (held by
the `app-worker` Turbo boundary tag — allows contracts/domain/db/env/config/adapters).
Extension point: one folder per business area under `src/modules/<area>/`, exporting a
`TemporalWorkerRegistration` that `worker.module.ts` composes — a second area is one line at
the root plus its own folder, with no framework edit. A module NEVER constructs its own
connection to the orchestrator (`temporal-client-fenced`); `common/` owns the single one and
must not import a module (`common-imports-no-modules`), which is why the host depends on the
registration INTERFACE and the root does the composing.

### infra — deployment and local-stack material (not a package)
Owns: `infra/temporal/` — the production-like local Temporal stack (compose, pinned digests,
development PKI, bootstrap and the probe scripts that prove identity, durability, rotation and
upgrades) — and `infra/temporal/deploy/` — the reviewed, UNDEPLOYED production candidate
(image, Fly template, rendered config, runbooks, alerts). Allowed deps: none — it is NOT a
workspace package (`pnpm-workspace.yaml` covers apps/packages/tests only), so it is outside the
build graph, the lockfile, dep-cruiser and knip. Platform scope: operator tooling. Belongs:
anything needed to RUN or DEPLOY a dependency that is not application code. Never: product
code, a workspace dependency, or a real credential — `pki/` is gitignored development material.
Extension point: one folder per deployed dependency.

### tests/invariants — the proof layer
Owns: executable invariants (tenancy/RLS, table scoping, enum parity, schema parity,
tenant-id-in-body) run by pnpm turbo test; fail-closed under CI, loud-skip locally
without DATABASE_URL. Allowed deps: contracts, domain, db, env, config — importing both
the wire and the schema is the POINT: an invariant proves the seam between them. Platform
scope: backend only (a Node tsx runner). Belongs: a new invariant when a rule can be proven
mechanically against the live schema or contracts. Never: a UNIT test — one lives at
`<package>/tests/**/*.test.ts` beside the package it proves (owner ruling 2026-09-03), and
proves one DECISION at its edges where an invariant proves a property of the SYSTEM against
real state; anything needing a mock. Extension point: one file per invariant + a run.ts call.

### `<package>/tests/` — unit tests, beside the package they prove
Owns: `*.test.ts` for the LOGIC layers only — `packages/domain`, `packages/contracts`,
`packages/forms`, `apps/api`, `apps/worker` — run by `pnpm test:unit` (vitest, config at
`vitest.config.mts`). Outside `src/`, so the package's own `tsc -b` never compiles a test into
`dist/`. Allowed deps: the package's own `src/`, by RELATIVE path — `@heliogrid/<pkg>` resolves
to built `dist/` and would test the last build. Platform scope: shared. Belongs: the boundary
value, the one either side of it, the empty, the negative. Never: a frontend package (proven by
running it), `packages/data` (proven by driving the real client), a mock of something this repo
owns. Extension point: a per-glob coverage threshold in `vitest.config.mts`, landing with the
slice it covers.

## §3 Platform rules — React Native · Next.js · shared

### React Native (apps/mobile)
- UI composes from @heliogrid/ui ONLY — its RN half is the `.native.tsx` file in each
  component folder (docs/engineering/17 §2). Interactive RN primitives (Text, Pressable, TextInput…)
  are lint-banned in screens; layout primitives (View, ScrollView) allowed.
- No web-only dependencies, no DOM APIs. No expo, no EAS, no AsyncStorage (owner rulings;
  see apps/mobile/CLAUDE.md landmines for the dated reasons).
- Platform APIs (camera, storage, notifications, keychain) stay isolated in dedicated
  modules under apps/mobile/src/ (today: auth/ — push/ was deleted 2026-08-25 and returns
  with the notifications slice; adapter packages land with their modules).
- Host lifecycle belongs to ONE root adapter, not to screens: src/react-query-host.tsx
  bridges AppState → React Query focus and NetInfo → its online state, refcounted so a
  Strict-Mode double mount installs one listener set and a remount leaks none. It is NOT
  offline support — there is no persistence and no queue.
- Navigation is React Navigation static config; navigation state derives from shared
  session/domain state, never duplicated into screens.
- Metro is the bundler: RN debug builds serve JS lazily — a screen "running" on a
  loading view proves nothing (QA lore, measured property of Metro).

### Next.js (apps/web)
- UI composes from @heliogrid/ui ONLY (raw elements lint-banned across app/ and
  features/). app/ routes; features/ own capability; page.tsx never holds logic.
- Server/Client boundary: product screens are client components ("use client" at the
  screen/feature level, not sprinkled per-widget); server components are the default only
  for pure-render routes. DOM-only APIs (window, navigator) live in
  hooks under features/*/shared/, never in shared packages, never at module top level
  (SSR executes it).
- No React Native imports of any kind. Web-specific optimization (SSR/RSC/caching)
  never leaks into shared packages.

### Shared (packages/*)
- Platform-agnostic by law (Law 10): no DOM, no react-native, no Node-only APIs outside
  declared server entries (env/server, db, data's client is isomorphic-fetch). The
  @heliogrid/db/uuid subpath imports node:crypto and is backend-only; the former frontend
  exemption is retired (web-no-db/mobile-no-db now cover the full db package).
- Business logic, policy numbers, protocol constants → domain. Flow view-model TYPES and
  policy shared by both platforms → domain, authored once BEFORE either screen consumes
  them (Law 11); the store or repository that fills them → data. Copy both platforms need
  → packages/i18n/src/copy. Visual values → tokens. Wire shapes → contracts. Form state →
  forms.
- Platform-specific implementations are injected via app-side modules (adapter packages
  land per-module; the fences for them already exist in dep-cruiser and turbo tags —
  deliberate pre-landing, per admin-pool-fenced's pattern).

## §4 Placement procedure — run BEFORE writing any new file

Walk top-down; first match wins. Every implementation plan's "Architecture Placement"
section records the answer per new file.

1. Is it a wire shape (request/response/enum crossing HTTP)? → packages/contracts
   (+ /contract-change).
2. Is it stored schema? → packages/db via /migration, in the owning module's slice (Law 9).
3. Is it business logic, a policy number, a protocol constant, a permission rule, or a flow
   view-model both platforms read? → packages/domain (pure TS only). A capability or a
   visibility scope is ALWAYS domain — never an `if role === …` in a handler, which is the
   repo-wide sweep `docs/engineering/forward-compat.md`'s auth/tenancy row exists to prevent.
4. Is it data access (fetch, cache, session store)? → packages/data (react only under
   src/react/ and src/server/; a new repository is registered in src/composition.ts, and
   nothing else may build a client or a transport).
5. Is it form state/validation wiring? → packages/forms.
6. Is it user-visible copy needed by both platforms? → packages/i18n/src/copy. Is it the
   SET of languages? → packages/contracts/src/locale.ts, and nowhere else — i18n and the
   Lingui CLI both read it from there.
7. Is it a visual value (color, spacing, type scale)? → the live design system via
   packages/theme (`ds:pull`) — never a literal in a screen, never hand-transcribed.
8. Is it a reusable visual component? → packages/ui/src/components/<Name>/ — the shared
   `<Name>.types.ts` plus `<Name>.tsx` (web) and `<Name>.native.tsx` (RN), one change
   (Law 7).
9. Is it screen composition/rendering for one platform? → that app's screens/features
   tree, composing the layers above. Screens hold rendering, not policy.
10. Is it environment/config? → a schema in packages/env + .env.example. A raw process.env
    read anywhere else needs an entry in scripts/check-env-access.mjs's audited allowlist
    (§2 env lists today's three).
11. None of the above fits → STOP. Name the mismatch to the owner before creating a new
    package or directory (CLAUDE.md §4 stop-and-ask).

**Branding a shared fact** (CLAUDE.md §8). The symbol stays unexported, so the owner's constructor
is the only door in, and `as <Brand>` outside the owner is the cast `M60` looks for:

```ts
declare const MONEY: unique symbol;                    // not exported
export type Money = number & { readonly [MONEY]: 'INR' };
export function money(minorUnits: number): Money { … } // the only door in
```
