# HelioGrid architecture — the spine

The single canonical home for inter-package facts: what each package owns, what it may
depend on, its platform scope, and where new code goes. Other documents POINT here; none
restates it.
This file states POLICY. The current dependency graph lives in package.json files;
enforcement lives in .dependency-cruiser.cjs (authoritative) and turbo boundaries tags
(coarse cover). Anything describing unbuilt design carries a STATUS banner.

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
- db is backend-only, except the @heliogrid/db/uuid subpath (app-side id generation — see
  its caveat in §2 db).
- **A §2 block is the policy; it is not a claim that something enforces it.** What each
  mechanism can actually hold — and where turbo tags are broader or narrower than policy —
  is the enforcing config itself. A tag is never evidence that a rule is held.

## §2 Package registry

Every block carries seven fields: **purpose** (the heading) · **owns** · **allowed deps**
(policy — the workspace packages it MAY import) · **never** · **platform scope** ·
**belongs/never here** · **extension point**. A block missing one is incomplete. Anything
not built yet carries a STATUS line, per this file's header.

### config — shared tsconfig presets
Owns: tsconfig presets (node-package, nest-app) and nothing else. Allowed deps: none.
Platform scope: all. Belongs: a new compiler preset. Never: runtime code, lint config
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
Owns: ts-rest routers, request/response Zod schemas, wire enums, the error envelope, and
typed BullMQ job payloads (jobs.ts, published as the `./jobs` subpath — dep-cruiser's
package-index-only permits exactly index and jobs as entry points). Emits the committed
openapi/openapi.json, gated by scripts/check-openapi-breaking.mjs. Allowed deps: domain
(for z.enum over domain constants — returns with the auth rebuild), config. Platform
scope: shared. Belongs: anything crossing HTTP. Never: tenant identity on the wire
(`packages/contracts/CLAUDE.md` carries the rule, its invariant and the jobs carve-out);
implementation; storage shapes. Extension points: a feature module mounts its router into
apiContract (Law 3: contract before implementation); ports/<capability>.ts re-lands with
its consumer.

### domain — pure business truth
Owns: business logic, policy numbers, protocol constants, formatters, flow view-model
types shared by platforms (Law 11). Allowed deps: config. Platform scope: shared, pure TS
— no react, no node builtins, no clock/randomness/I-O (domain-purity gates). Belongs: a
constant two screens read; a flow state machine. Never: fetch, storage, rendering.
Extension point: one folder per module slice (auth/, tenancy/, format/ today).

### db — schema mirror, migrations, backend client
**STATUS: greenfield since 2026-08-01 (ADR-0024).** `src/schema/` and migrations 0001–0006
were deleted; the auth + tenancy slice re-authors them and the next migration is a fresh
0001. Today the package is client.ts + migrate.ts + uuid.ts.
Owns: append-only migrations and the Drizzle schema mirror (both re-authored per above),
the migrate runner (sha256-locked, advisory-locked), the pool factory `createDb` plus RLS
plumbing (withTenantTransaction, the runtime-role assertion, ping), and the uuid subpath.
The admin/runtime pool PAIR is not here — apps/api constructs it (admin-pool-fenced).
Allowed deps: config. Platform scope: backend only — EXCEPT @heliogrid/db/uuid, which
web-no-db/mobile-no-db exempt for app-side id generation. **Caveat: uuid.ts currently
imports node:crypto, which neither Metro nor a browser bundle resolves, so the first
frontend consumer needs a crypto shim or a platform-safe RNG — no app imports it yet.**
Belongs: DDL for the current module's slice (Law 9).
Never: contracts imports (db-no-upward — the enum-parity invariant is the seam that keeps
pgEnum ↔ z.enum honest); business logic. Extension point: /migration authors the next
numbered file.

### data — the ONLY frontend wire path (ADR-0023)
Owns: the typed client (sole initClient), repositories, session store, react-query
adapters under src/react/ only. Allowed deps: contracts, domain, config. Platform scope:
shared frontend (core framework-free; react confined to src/react/). Belongs: every new
endpoint's repository + hook. Never (all held by data-lean): db — INCLUDING the uuid
subpath, which is exempted only for the two apps, not for data — ui, theme, i18n,
adapters, and any app; a second client; platform APIs. Extension point: one repository per
contract router.

### forms — the fenced form layer
Owns: useZodForm, applyServerErrors (server VALIDATION_FAILED → field errors), the
translated zod error map (installFormsErrorMap), and the re-exports apps must use instead
of the raw libraries — `z`, Controller/useFieldArray/useWatch and the react-hook-form
types. Allowed deps: config (react-hook-form/zod are its third-party internals).
Platform scope: shared frontend. Belongs: form-state wiring. Never: schemas themselves
(contracts) or copy (i18n). Extension point: new form primitives, exported through the
index only.

### i18n — catalogs and shared copy
Owns: Lingui catalogs (compiled messages committed), LOCALES derived from contracts'
uiLanguageSchema (never restated), src/copy/ shared-copy modules (React-free /*i18n*/
descriptors — JSX is banned there for the dual-instance ESM/CJS hazard). Allowed deps:
contracts, domain (the money/format helpers when domain's money slice lands — the turbo
i18n tag already permits this edge), config. Platform scope: shared frontend. Belongs:
copy both platforms render (Law 11). Never: macro imports (lint-banned); locale-default
number formats for money
(CLAUDE.md §7: tenant-currency grouping). Extension point: new copy modules keyed by
contract enums where applicable.

### theme — tokens, the semantic layer and the provider  (NOT BUILT YET — docs/17)
Owns: `src/_generated/` pulled from the LIVE design system (`pnpm ds:pull`), the semantic
role mapping, the RN theme registration, the web provider; emits tokens.css + print.css;
the WCAG DECLARED_PAIRS gate. Allowed deps: none at runtime (config dev-only). Platform
scope: shared. Belongs: every visual value. Never: hand-edited `_generated/` (the v1
package was hand-copied and drifted in days — docs/17 §1); workspace imports. Extension
point: emit targets grow here. Replaces the v1 `tokens` package, deleted 2026-08-19.

### ui — the design system, BOTH platforms  (NOT BUILT YET — docs/17)
Owns: `primitives/` (the ~8 atoms, two of which hold product law — 44px targets and
status-never-by-colour-alone) and `components/<Name>/` where `<Name>.types.ts` is the one
prop contract, `<Name>.tsx` is web and `<Name>.native.tsx` is RN. Allowed deps: contracts,
domain, theme, config. Platform scope: BOTH. Belongs: a new shared visual component — one
folder, three files, one change (Law 7). Never: screens/routes; data access; navigation;
raw colour (adherence gate). Extension point: a folder under `src/components/`.

Replaces the v1 split of `packages/ui` (web) + `apps/mobile/src/ui` (RN) +
`packages/ui-api` (types), all deleted 2026-08-19. That arrangement stated one prop list
three times and needed `check-ui-parity.mjs` to compare them; the shared `.types.ts` makes
divergence a type error instead.

### apps/web — Next.js
Owns: routes (app/ — routing only), features/ (capability owners), web screens, and lib/
(app infrastructure: ApiErrorText + its css, and env.ts — the allowlisted literal
NEXT_PUBLIC_* read; see §2 env). Allowed deps: contracts, data, domain, env, forms, i18n,
tokens, ui, config. Platform scope: web (browser + Next server runtime). Belongs: screen
composition, web-only hooks (DOM APIs) under features/*/shared/. Never: db (web-no-db;
uuid subpath exempt), @ts-rest/* or any HTTP client (apps-never-touch-the-wire,
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
flag must be copied here). Platform scope: native only (iOS + Android, bare React Native —
no Expo, no DOM). Belongs: screen composition and the native adapters the screens consume;
anything both platforms need belongs in a package instead (Law 11). Never: a local
component mirror (the RN half lives in @heliogrid/ui as `.native.tsx`), db (uuid exempt),
wire/form internals (same fences as web), expo/EAS/
AsyncStorage (owner rulings). Extension point: a new screen is a new src/screens/<screen>/
folder. Platform rules: §3.

### apps/api — NestJS BFF
Owns: API modules (health today; feature modules land per slice), the ContractException
error envelope, the tenancy runtime precondition, and the RUNTIME_DB/ADMIN_DB pool pair in
common/db (fenced by admin-pool-fenced — db provides the factory, this app builds the
pair). Allowed deps: contracts, db, env, config (+ domain when the rebuild re-adds its
consumer). Platform scope: backend only (Node). Belongs: the HTTP edge and its
repositories. Never: ui/tokens/i18n/data (frontend layers) — **POLICY ONLY, unenforced
today: the shared `app` turbo tag permits them and no dep-cruiser rule fences it**; raw
process.env (env owns it). Extension point: one Nest module per contract router,
repositories fenced by db-access-in-repositories-only.

### apps/worker — queue processors
**STATUS: scaffold.** No processor or scheduler exists yet — src/ holds main.ts,
worker.module.ts and config/ only.
Owns: BullMQ binding config (today just the root connection in worker.module.ts).
Processors and their queues land with their owning modules. Allowed deps: contracts, db,
env, config. Platform scope: backend only (Node, no HTTP surface). Belongs: work that must
outlive a request. Never: HTTP handlers (api owns the edge); frontend layers — **POLICY
ONLY, unenforced today, same shared `app` tag as apps/api**. Extension point: one
`<m>.processor.ts` per queue inside its owning `src/modules/<m>/` (the apps/api module
shape); worker.module.ts registers ONLY the root connection (bullmq-fenced).

### tests/invariants — the proof layer
Owns: executable invariants (tenancy/RLS, table scoping, enum parity, schema parity,
tenant-id-in-body) run by pnpm turbo test; fail-closed under CI, loud-skip locally
without DATABASE_URL. Allowed deps: contracts, domain, db, env, config — importing both
the wire and the schema is the POINT: an invariant proves the seam between them. Platform
scope: backend only (a Node tsx runner). Belongs: a new invariant when a rule can be proven
mechanically against the live schema or contracts. Never: unit tests (owner directive
2026-07-29); anything needing a mock. Extension point: one file per invariant + a run.ts
call.

## §3 Platform rules — React Native · Next.js · shared

### React Native (apps/mobile)
- UI composes from @heliogrid/ui ONLY — its RN half is the `.native.tsx` file in each
  component folder (docs/17 §2). Interactive RN primitives (Text, Pressable, TextInput…)
  are lint-banned in screens; layout primitives (View, ScrollView) allowed.
- No web-only dependencies, no DOM APIs. No expo, no EAS, no AsyncStorage (owner rulings;
  see apps/mobile/CLAUDE.md landmines for the dated reasons).
- Platform APIs (camera, storage, notifications, keychain) stay isolated in dedicated
  modules under apps/mobile/src/ (today: push/ and auth/; adapter packages land with their
  modules).
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
  declared server entries (env/server, db, data's client is isomorphic-fetch). The one
  known breach is @heliogrid/db/uuid, which §2 db exempts for frontends but which imports
  node:crypto — the caveat is recorded there and no app imports it yet.
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
3. Is it business logic, a policy number, a protocol constant, or a flow view-model both
   platforms read? → packages/domain (pure TS only).
4. Is it data access (fetch, cache, session store)? → packages/data (react only under
   src/react/).
5. Is it form state/validation wiring? → packages/forms.
6. Is it user-visible copy needed by both platforms? → packages/i18n/src/copy.
7. Is it a visual value (color, spacing, type scale)? → the live design system via
   packages/theme (`pnpm ds:pull`) — never a literal in a screen, never hand-transcribed.
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
