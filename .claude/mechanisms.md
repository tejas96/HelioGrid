# Mechanisms — what actually holds each rule

**This is the ONLY place enforcement is described.** A rule anywhere else states an invariant and
cites a row id (`M12`); it never names a gate, and it never claims something is enforced. A gate's
own header is one line pointing back at its row.

One row per LIVE mechanism: the fact it decides, and the command that runs it. Ids are stable and
never reused; a gap is a row that was retired. A fact no row holds is held by a reviewer and the
owner, and a rule that states it says `review-only`. A mechanism is proven red — made to FIRE on a
deliberately injected violation — in the pull request that adds or changes it (Law 12); that proof
lives in the pull request, never here. A check that leaves or narrows names, in its pull request,
where each path it fired on is held now.

## Imports and layering

| id | fact | command |
|---|---|---|
| M1 | Imports point downward, or along an edge `architecture.md` §2 declares. A workspace import resolves through `dist/`, so it runs after a build. | `pnpm lint` (dependency-cruiser) · `pnpm boundaries` |
| M2 | Shared packages hold no DOM, no React Native, no Node-only API outside a server entry (Law 10) — by import graph; a type-only import erases. | `pnpm lint` (dependency-cruiser purity rules) |
| M3 | A package exposes only its index: every package restricts its `exports`, and a deep import into any `@heliogrid/*/src/` is refused. | `pnpm lint` (dependency-cruiser `package-index-only`) |
| M4 | An app never touches the wire or the form library directly. | `pnpm lint` (biome `noRestrictedImports` · dependency-cruiser) |
| M5 | `process.env` is read only where biome's `noProcessEnv` override names — a `process` reached by destructuring or an alias is not seen, review-only — and `.env.example` names every schema variable. | `pnpm lint` (biome · `check:env`) |
| M109 | No secret enters the tree; the hook fails closed without the scanner. | `pnpm check:secrets` on the staged change (git pre-commit) · CI `Secret scan` |

## Tenancy and data

| id | fact | command |
|---|---|---|
| M10 | The tenant pin is transaction-local: `set_config('app.tenant_id', …, true)`. | `pnpm check:adherence` 5 |
| M11 | Every tenant-scoped read passes through the tenant transaction: a tenant repository is injected a `TenantPool`, and the `TenantScopedDb` it yields is branded with a symbol exported nowhere. | `pnpm turbo typecheck` |
| M124 | Only a `*.reference.repository.ts` reaches the tenant-free pool — the token, not the query. | `pnpm lint` (dependency-cruiser `reference-pool-fenced`) |
| M12 | Every table is tenant-scoped (`tenant_id`, unique keys leading with it, fail-closed RLS, explicit grants), armed platform data, unreachable global, or readable reference data listed with its reason. | `pnpm turbo test` (invariants `table-tenancy-scan` · `rls-armed`; db-backed) |
| M13 | A cross-tenant read returns zero rows, a cross-tenant write fails, no context fails closed, and an append-only ledger holds no mutating grant — driven as `app_user` over two seeded tenants. | `pnpm turbo test` (invariant `tenancy-rls`; db-backed) |
| M14 | Tenant identity never crosses the wire: no `tenantId` in a contract's body, query or path. | `pnpm turbo test` (invariant `tenant-id-on-the-wire`) |
| M15 | Every route declares the capability it needs, deny by default: `RouteAccessMap` is `Record<keyof router, RouteAccess>`, and a route no map covers answers 401. | `pnpm turbo typecheck` · `SessionGuard` as `APP_GUARD` |
| M16 | A permission decision is taken in `packages/domain`, never as `if role === …` in an app. | `pnpm check:adherence` 10c |
| M110 | Presets compose only by OR on grants and widest-wins per domain, from the preset set alone (`F2-11`, `F2-13`–`F2-15`). | `pnpm test:unit` (`packages/domain/tests/authz/resolution.test.ts`) |
| M108 | The capability and visibility matrices in code equal `F2` §F2.5 cell for cell, and the presets are `F2-01`'s twelve in its order. | `pnpm turbo test` (invariant `matrix-mirrors-f2`, reads the PRD) |
| M134 | The message-template keys in code equal `F6-26`'s exhaustive list, both ways. | `pnpm turbo test` (invariant `template-keys-mirror-f6`, reads the PRD) |
| M17 | pgEnum values equal the contract `z.enum` values; a new pgEnum is mapped or excused by name. | `pnpm turbo test` (invariant `enum-parity`; db-backed) |
| M18 | The Drizzle schema mirrors what the migrations built: tables, columns and nullability both ways, and indexes by name, method, key columns with direction, uniqueness and predicate presence. | `pnpm turbo test` (invariant `schema-parity`; db-backed) |
| M19 | Migrations are append-only. | PreToolUse hook `block-applied-migration-edit.sh` · the sha256-locked runner · CI diff guard |
| M20 | An agent never writes to the database: a database client or drizzle `push`/`migrate` at a command position, behind any wrapper, is refused. | PreToolUse hook `block-db-write.sh` |

## Contracts and the wire

| id | fact | command |
|---|---|---|
| M25 | The committed OpenAPI equals what the contract emits; a `.refine()` or `.transform()` is not emitted, so a narrowing there is invisible. | `pnpm check:openapi` |
| M26 | A breaking change to the API's shape fails against the pinned `oasdiff`; a set that grows by design is `x-extensible-enum`. | `pnpm check:openapi` (`scripts/oasdiff-pin.json`) |
| M27 | Every non-2xx response is the canonical envelope. | the global exception filter and response validation in `apps/api` |
| M138 | Every route that answers 201 declares the `idempotency-key` header; each create's own lookup is its own wire test. | `pnpm test:unit` (`packages/contracts/tests/create-retry-key.test.ts` · `apps/api/tests/*/retried-*.test.ts`) |

## UI and platform parity

| id | fact | command |
|---|---|---|
| M35 | One prop contract per component, both platforms — names compared, not types. | `pnpm ds:contract` |
| M36 | The two platform halves declare the same accessibility semantics — lexically. | `pnpm ds:contract` (h) |
| M37 | A ported prop means what the design system says it means — declarations, not renders. | `pnpm ds:contract` (a) (b) (c) |
| M130 | Every notification type is registered with who raises it, who receives it, its channels and its urgency: `NOTIFICATION_REGISTRY` is `Record<NotificationType, …>`, and the column is a pgEnum (`M17`). | `pnpm turbo typecheck` |
| M118 | Icons are drawn in `packages/ui`, never taken from an icon package. | `pnpm lint` (biome `noRestrictedImports`, `lucide-*`) |
| M40 | No raw colour in a UI path — hex, `rgb()`, `hsl()`, or a named colour on a colour property; `color-mix()` over tokens passes. | `pnpm check:adherence` 3 |
| M143 | A screen writes no size: every length, size key and Tailwind size utility in the app trees comes from a token; `0`, `%`, `vw`, `vh` and a `--bp-*` breakpoint pass; `packages/ui` is out of scope. | `pnpm check:adherence` 16 |
| M144 | Every icon-only control carries a label: `IconButton.label` and `Button.children` are required strings, and an empty literal is refused. | `pnpm turbo typecheck` · `pnpm check:adherence` 17 |
| M145 | v1 is light-only: no colour-scheme API or `dark:` in the UI trees, `color-scheme: only light` on web, `UIUserInterfaceStyle = Light`, Android themes Light with `forceDarkAllowed` false, every semantic alias a `var()` chain. | `pnpm check:adherence` 18 |

## Copy and locale

| id | fact | command |
|---|---|---|
| M133 | The bundled faces answer for themselves: the sans stack's coverage, weights and line box are read from the woff2 at build, and a face short of a sanctioned weight refuses to emit. | `pnpm --filter @heliogrid/theme build` |
| M47 | The catalogs are freshly extracted. | `pnpm check:catalogs` |
| M48 | Every UI language is registered: `LANGUAGE_META` and the catalog loaders are `satisfies Record<UiLanguage, …>`; the phone's plural data is not yet (`docs/tasks/deferred.md`). | `pnpm turbo typecheck` |
| M146 | A closed vocabulary's translated words never merge two members into one word, across every vocabulary one surface shows together (`F3-12`). | `pnpm test:unit` (`packages/i18n/tests/closed-vocabularies.test.ts`) |
| M135 | A language in the set is ready (`F3-27`): every character covered by the sans stack, plural rules present with every category, a static phone face per sanctioned weight in both bundles, Android resolving each family by name. Reads the BUILT packages. | `pnpm check:languages` |
| M49 | One format implementation (`new Intl.*` only), and a compacted amount keeps its disclosure (`F3-24`). | `pnpm turbo test` (invariant `format-rendering`) |

## Code shape

| id | fact | command |
|---|---|---|
| M55 | Formatting; no `any`, `!`, `==` or `console.log` in anything served. | `pnpm lint` (biome) |
| M56 | A source file stays under 300 code lines; configs are excluded by name. | `pnpm lint` (biome `noExcessiveLinesPerFile`) |
| M57 | `packages/domain` is pure: `fetch`, `XMLHttpRequest`, the timers, `performance`, `crypto`, the platform objects that reach them by another name (`globalThis`, `window`, `self`, `global`) and any `node:` import are refused by biome; `Date.now`, `new Date(` and `Math.random` by the grep; the import graph by dependency-cruiser. | `pnpm lint` (biome · dependency-cruiser) · `pnpm check:adherence` 4 |
| M58 | An app declares no enum, union, lookup or policy number, and no package copies a literal set of three or more that `contracts` or `domain` declares. | `pnpm lint` (biome `noEnum` · `noMagicNumbers`) · `pnpm check:adherence` 10, 10d |
| M59 | A literal SQL verb never appears in an app; index-backed, no N+1 and no `select *` are review-only. | `pnpm check:adherence` 10c |
| M60 | A brand is never obtained by `as <Brand>` outside its owner, for every brand in the check's registry, which `M125` keeps complete. | `pnpm check:adherence` 10b |
| M61 | Duplication never increases — a ratchet at today's percentage, not zero. | `pnpm check:dupes` |
| M62 | Dependency versions agree across every manifest. | `pnpm lint` (sherif) |
| M63 | A lockfile is generated, never authored. | PreToolUse hook `block-lockfile-edit.sh` · CI's frozen-lockfile install |
| M96 | Every overage rate sits ≥40% above its worst-case unit COGS (`BM-17`), per authored book. | `pnpm test:unit` (`packages/domain/tests/pricing/cogs.test.ts`) |
| M97 | An absorbed cost is never also a meter (`BM-16`, `BM-24`). | `pnpm turbo typecheck` (`satisfies readonly Exclude<…, Meter>[]`) |
| M98 | Only `trialing` and `expired` are reachable without paying (`BM-03`, `BM-29`). | `pnpm turbo typecheck` (`Record<BillingState, boolean>`) · `pnpm test:unit` (`isNonPaying`) |
| M99 | A trial withholds no capability to bound cost (`BM-28`, `BM-31`). | `pnpm test:unit` (`trialCapacity`) |
| M100 | No billing phase takes away read, export, customer links or billing screens (`BM-32`), nor a photo already on a device (`BM-36`). | `pnpm turbo typecheck` (nested exhaustive `Record`) · `pnpm test:unit` (`isAlwaysOn`) |
| M101 | A bundle discloses at 80% before any gate fires (`BM-27`, `BM-34`). | `pnpm test:unit` (`capWarningReached`) |
| M102 | A lapse forfeits price protection, and the grace window does not (`BM-42`). | `pnpm turbo typecheck` (`Record<BillingState, boolean>`) · `pnpm test:unit` (`forfeitsPriceProtection`) |
| M103 | A capacity change reaches a protected tenant at once only if it took nothing away (`BM-42`) — capacity, never price. | `pnpm test:unit` (`appliesImmediately`) |
| M64 | The pre-commit gate is never skipped: `--no-verify` in any spelling, `-n`, a hooks path or the hook variables are refused. | PreToolUse hook `block-no-verify.sh` |

## Tests and proof

| id | fact | command |
|---|---|---|
| M70 | A unit test is `<package>/tests/**/*.test.ts` in a package `packages/config/unit-test-packages.json` names; the runner, the check and the boundary rule read that one file. | `pnpm check:adherence` 1 · `pnpm lint` (dependency-cruiser) · `pnpm test:unit` |
| M71 | Coverage is 100% on `packages/domain/src/{money,tax,subsidy,pricing,authz}/**` and `commerce/tranche-allocation.ts`; everywhere else it is reported. | `pnpm test:unit` (vitest `thresholds`) |
| M73 | The invariants run before a change is called done; the db-backed ones skip loudly without a database. | `pnpm check:all` · `pnpm verify` |
| M139 | A ticket's claims are well formed: `**Cases:**` opens unique `C`/`S`/`D` ids, each claim with a proof of a known kind, `gate` and `held` citing a row here, every one of `/start`'s nine classes answered, done-when lines numbered, and every `qa-*` proof and QA step pointing at each other. Whether a proof is RIGHT is the reviewers'. | `python3 scripts/gates.py` gate 32 |
| M140 | A red proof is real: green unbroken, then red BY NAME on every run with the rule broken, the tree restored, filed only under a claim whose own proof names it; the latest proof per file, test, title, actor and claim set (order-free) is listed CURRENT or STALE; a mis-built proof, or one filed under a claim set no longer used, is withdrawn, never edited. | `scripts/break-and-run.sh` (`--stale <T-id>`) |
| M141 | A task's proof record goes once its branch's pull request merged; a clean room goes once its run stopped. | `scripts/break-and-run.sh --prune` (git post-checkout) · `scripts/verify-clean.sh` |
| M147 | A Laws row that says a task carries an owed line names only tasks that hold one. | `python3 scripts/gates.py` gate 33 |

## Cross-platform behaviour

| id | fact | command |
|---|---|---|
| M80 | A screen holds no timer and no reducer: `setTimeout` and `setInterval` are refused in the screen trees, `useReducer` in every app file (Law 11). | `pnpm lint` (biome `noRestrictedGlobals` · `noRestrictedImports`) |

## Docs and governance

| id | fact | command |
|---|---|---|
| M126 | The build order is computed: `docs/build-order.md`'s blocks place every task file, a file no block places is wholly V2 by its screens, no loop, no live task waits on a struck or V2 one, a later-block wait is recorded and its ruling owed once its block opens, a parked task is never ready, and the next ready task is printed on every run — over declared `Depends on:` lines only. `next-screen.py` reads the same blocks. | `python3 scripts/gates.py` gate 30 · `scripts/next-screen.py` |
| M128 | A designed or shipped screen names the digest of the brief its design was reviewed against; a brief changed since is refused until reviewed again; `owed` leaves the build order and heads the design queue; a shipped screen names its code's verdict. | `python3 scripts/gates.py` gate 31 · gate 30's ready list · `scripts/next-screen.py` |
| M125 | Every `unique symbol` brand declared under `packages/` is in `M60`'s cast registry, untracked files included; every other guarded kind is enrolled by hand at `/start` (Law 12). | `pnpm turbo test` (invariant `brand-registry`) |
| M90 | The suite's bookkeeping: over 1,000 live PRD rows (1); no task, brief, PRD document or register cites a deleted row (2); every quote equals its cell, or cuts or extends it (4); no dangling task id (5); every register screen has a brief (6) and a DESIGN task (7); every PRD row dispositioned once, struck agreeing (15); V1 locked at 99 (17); `next-screen.py` agrees with the register (18). | `python3 scripts/gates.py` |
| M93 | An agent never pushes to `main` and never force-pushes. | PreToolUse hook `block-main-push.sh` |
| M106 | One ledger: a task is `planned`, `designed`, `shipped (#PR)` or `struck`, its heading and its screens agree, a shipped id is named by a commit subject in `HEAD`'s history, every id that history names still has a block, and no id is held by two blocks. | `python3 scripts/gates.py` gate 27 |
| M114 | Every web page sits in one session group — `(door)`, `(open)`, `(inside)` — whose layout is its gate. | `pnpm lint` (dependency-cruiser `web-page-sits-in-a-session-group`) |
| M113 | A runtime change is committed only with `/verify`'s stamp for the index's digest, and every red proof of the branch's task reads CURRENT against the index; CI reads the stamp again on every PR head. | git pre-commit and pre-merge-commit (`.claude/hooks/block-unverified-commit.sh`) · CI `quality` |
| M119 | The transport tells the session store when a refresh could not save a call: `SessionSignals` is required on every `TransportConfig` mode that holds a session. | `pnpm turbo typecheck` |
| M120 | The worker finds its workflow bundle when run from source, as `tsx watch` does. | `pnpm test:unit` (`apps/worker/tests/temporal/workflow-bundle.test.ts`) |
| M121 | A framework exception's generic code is chosen explicitly: the status map is unexported, `httpStatusFor` answers forward and `genericErrorCodeByStatus` reverse. | `pnpm turbo typecheck` |
| M123 | `apps/mobile/src/screens/shared/` is reached only by a screen. | `pnpm lint` (dependency-cruiser `mobile-shared-parts-are-screens-only`) |
| M112 | The local proof runs in CI's room: a fresh clone of what git would commit, every git-ignored path absent, the quality lane's `env:` read from the workflow. | `pnpm verify:clean` |
| M116 | A service reads no file of its own: `node:fs` and `fs` are refused under `apps/api/src/**` and `apps/worker/src/**`, but the worker's bundle assertion. | `pnpm lint` (biome `noRestrictedImports`) |
| M117 | A server image runs unprivileged: a `USER` after the last `FROM` of every `apps/*/Dockerfile`. | `pnpm check:adherence` 14 |
| M137 | A verdict line for a proof the author drives is written by the recorder from the command's own output, with its log and the log's hash; a hand-typed line is refused by the reviewer. | `scripts/record-proof.sh` · `break-it-reviewer` at `/ship` |
