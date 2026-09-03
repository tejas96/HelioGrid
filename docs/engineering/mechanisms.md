# Mechanisms — what actually holds each rule

**This is the ONLY place enforcement is described.** A rule anywhere else states an invariant and
cites a row id (`M12`); it never names a gate, and it never claims something is enforced. A gate's
own header is one line pointing back at its row.

Ids are stable and never reused. A gap is a row that was retired.

## Status vocabulary

| | |
|---|---|
| **HELD** | The mechanism exists, covers the whole invariant, and fires. |
| **PARTIAL** | It fires on a subset, or on a shape rather than the property. The gap column says which. |
| **VACUOUS** | The mechanism is correct and has nothing to inspect yet. It reports this itself. |
| **NONE** | Review-only today. Nobody is watching. |

**`red:` is the date the mechanism was last seen to FAIL on a deliberately injected violation.**
A row with no date has never been proven; its status is read from the code, not from a run. A rule
may cite a row only when that row is HELD or PARTIAL — never a NONE row, and never a VACUOUS one.

## Mechanism order

A type, then a lint rule, then an invariant, then a script. A script encodes today's tree and rots;
adding one needs an owner ruling saying why no type and no lint rule can hold it. Prefer moving a
row UP this order over widening the script that currently holds it.

---

## Imports and layering

| id | invariant | mechanism of record | status | gap, or what would close it |
|---|---|---|---|---|
| M1 | Imports point downward, or along an edge `architecture.md` §2 declares | dependency-cruiser · turbo boundaries | HELD · red 2026-09-03 | Resolves a workspace import through `dist/`, so it must run AFTER a build or dist-targeting rules are inert (`ci.yml`, proven 2026-07-31). |
| M2 | Shared packages hold no DOM, no React Native, no Node-only API outside a server entry (Law 10) | dependency-cruiser purity rules | HELD | Import-graph only. A type-only import erases, and a wrapper with no import has no edge to catch. |
| M3 | A package exposes only its index | dependency-cruiser `package-index-only` | HELD | Enumerates five packages by name with per-package entry regexes. A new package is unlisted, so unguarded. |
| M4 | An app never touches the wire or the form library directly | biome `noRestrictedImports` · dependency-cruiser | HELD | — |
| M5 | `process.env` is read only in `packages/env` | biome `noProcessEnv` · `check:env` | HELD · red 2026-09-03 | Deliberately doubled: widening the biome allowlist alone does not let a read through. |

## Tenancy and data

| id | invariant | mechanism of record | status | gap, or what would close it |
|---|---|---|---|---|
| M10 | The tenant pin is transaction-local (`set_config` third argument `true`) | `check:adherence` 5 | HELD | Retired by M11 once the handle exists. |
| M11 | Every tenant-scoped read passes through the tenant transaction | — | **NONE** | A `TenantScopedDb` handle constructible only inside `withTenantTransaction`. Repositories take the handle; a query outside it stops compiling. |
| M12 | Every tenant table carries `tenant_id`, a composite index, a fail-closed RLS policy and explicit grants | invariant `table-tenancy-scan` · `rls-armed` | VACUOUS | Zero tables. The checker rejects the known leak shapes and is ready; it needs migration 0001. |
| M13 | A cross-tenant read returns zero rows; a cross-tenant write fails; no context fails closed | invariant `tenancy-rls` | VACUOUS | As M12. |
| M14 | Tenant identity never crosses the wire | invariant `tenant-id-in-body` (static, always runs) | VACUOUS | Walks `body` and `query` only — `pathParams` is unchecked. Reports itself vacuous while no route declares a body or query schema. |
| M15 | Every route declares the capability it needs; deny by default | — | **NONE** | No guard exists; every route is public. A `SessionGuard` as `APP_GUARD` plus a typed route decorator, landing before any feature module. |
| M16 | A permission decision is taken in `packages/domain`, never as `if role === …` | `check:adherence` 10c | HELD · red 2026-09-03 | Apps only, and it restates the twelve role names — a second copy of the list inside the gate that forbids second copies. |
| M17 | pgEnum values equal the contract `z.enum` values | invariant `enum-parity` | VACUOUS | Zero pgEnums. Structural fix: let `db` import `domain` and build both from the one tuple, as contracts already does. |
| M18 | The Drizzle schema mirrors what the migrations built | invariant `schema-parity` | VACUOUS | As M12. |
| M19 | Migrations are append-only | PreToolUse hook · sha256-locked runner · CI diff guard | HELD | Three independent layers. The hook is agent-only; the runner and CI cover everyone. |
| M20 | An agent never writes to the database | PreToolUse hook | HELD | Agent-only. `psql -f file.sql` and any node script evade it. |

## Contracts and the wire

| id | invariant | mechanism of record | status | gap, or what would close it |
|---|---|---|---|---|
| M25 | The committed OpenAPI matches the contract | `check:openapi` (rebuild, re-emit, byte compare) | PARTIAL | `.refine()` and `.transform()` are dropped by the generator, so a real narrowing emits an identical spec. |
| M26 | A breaking API change is judged before it merges | `check:openapi` + `oasdiff` | PARTIAL | Advisory. A missing or unparseable `oasdiff` is a SILENT SKIP, not a failure. Closing it: fail when it is absent under CI. |
| M27 | Every non-2xx response is the canonical envelope | global exception filter · global response validation | HELD | A route declaring a NON-base error code still needs `ContractException` with that literal, which nothing checks. Closing it: make the status a required constructor argument. |
| M28 | The contract diff comes before the implementation (Law 3) | — | **NONE** | Review-only. `/contract-change` is the procedure, not a gate. |

## UI and platform parity

| id | invariant | mechanism of record | status | gap, or what would close it |
|---|---|---|---|---|
| M35 | One prop contract per component, both platforms (Law 7) | shared `<Name>.types.ts` · `ds:contract` platform-props | PARTIAL | The shared type constrains only a BASE. 187 of 194 platform files declare their own props above it, and the check compares NAMES, not types. Closing it: the whole contract in the types file, platform-local prop interfaces banned by one cruiser rule. |
| M36 | The two platform halves declare the same accessibility semantics | `ds:contract` (h) | PARTIAL | Lexical. It reads the words a file contains, not which element carries them, nor whether the value is real. |
| M37 | A ported prop means what the design system says it means | `ds:contract` (a) (b) (c) | PARTIAL | Reads declarations, not renders. Inherited and shorthand props are invisible, so it under-reports on purpose. |
| M38 | A component has its four files with the right names | — | **NONE** | `ds:check` was removed 2026-08-25. 13 web-only and 15 native-only sub-files sit unpaired. |
| M39 | A component mounts on both platforms | render harness (`docs/engineering/harness/`) | **NONE** | The harness exists and nothing runs it — no reference in `package.json`, `turbo.json`, `ci.yml` or `lint-all.sh` (verified 2026-09-04). Closing it: run it in CI. |
| M40 | No raw colour in a UI path | `check:adherence` 3 | HELD · red 2026-09-03 | Covers seven named folders. A new UI folder is unscanned until the list is edited. |
| M41 | A control never declares a shrink range | `check:adherence` 11 | HELD | CSS only. The other three render-harness probes need computed layout. |
| M42 | Style is not in the component file | — | **NONE** | True on web by convention, false on native: 228 `StyleSheet.create` blocks sit inside `.native.tsx`. Closing it: one ADR fixing the native styling choice, then a filename rule. |

## Copy and locale

| id | invariant | mechanism of record | status | gap, or what would close it |
|---|---|---|---|---|
| M45 | User-visible copy goes through Lingui | `check:adherence` 6 | PARTIAL | Scans three app folders. `packages/ui` is unscanned and holds 19 unwrapped literals plus 178 English default props. |
| M46 | Every extracted message is actually translated | `check:adherence` 7 | HELD | Catches an empty `msgstr`, which `lingui extract` cannot see. |
| M47 | The catalogs are freshly extracted | `check:catalogs` | HELD | Freshness only. A literal that was never extracted has no entry to go stale (that is M45's job). |
| M48 | Every contract UI language is fully registered | types (`satisfies Record<UiLanguage, …>`) · `check:adherence` 9 | HELD | Derives its expectation from `locale.ts` instead of restating the list. The model row for how to write a check. |
| M49 | One format implementation, and the PRD's exact strings ship | invariant `format-rendering` (static) | HELD | Knows `new Intl.*` only — a hand-rolled grouping loop or `toLocaleString()` is invisible. Enumerates with `git ls-files`, so an untracked file is exempt. |
| M50 | A UI component holds no user-visible English | — | **NONE** | `packages/ui` cannot import `packages/i18n`, so no prop can be typed as translated copy. Closing it: declare the `TranslatedText` brand in `contracts`, which `ui` may import; `i18n` stays the only constructor. |

## Code shape

| id | invariant | mechanism of record | status | gap, or what would close it |
|---|---|---|---|---|
| M55 | Formatting; no `any`, `!`, `==` or `console.log` | biome | HELD | `console.error`/`warn` allowed; the rule is off for scripts and invariants by name. |
| M56 | A source file stays under ~300 lines | biome `noExcessiveLinesPerFile` | HELD | Counts CODE lines. Configs and `docs/engineering/harness/**` are excluded by name. |
| M57 | `packages/domain` is pure: no clock, randomness or I/O | dependency-cruiser purity · `check:adherence` 4 | HELD | The grep names nine shapes; `Date.UTC` is not among them. |
| M58 | An app declares no enum, union, lookup or policy number | biome `noEnum` · `noMagicNumbers` · `check:adherence` 10 | HELD · red 2026-09-03 | Apps only, and EXPORTED declarations only. A package may declare freely. |
| M59 | A query lives in `packages/db` | `check:adherence` 10c (SQL verbs in an app) | PARTIAL | Catches a literal SQL verb in an app. Index-backed, no N+1 and no `select *` are review-only. |
| M60 | A shared fact is unspeakable outside its owner; never `as <Brand>` | `check:adherence` 10b | **NONE** | `BRANDS=''` — the registry is empty, so the loop runs zero times and the check cannot fire. Zero branded types exist in the repo. **`.claude/rules/architecture-ownership.md` lists this as "caught" in its 2026-09-03 measurement; that line is wrong today.** Closing it: register each brand on the day it lands. |
| M61 | No duplicated code | `check:dupes` (jscpd) | **NONE** | **Verified 2026-09-04: 99 clones, exit code 0.** `threshold: 12` in `.jscpd.json` is a PERCENTAGE of duplicated lines, not a line count — up to 12% passes. Closing it: `"threshold": 0`. |
| M62 | Dependency versions agree across every manifest | sherif | HELD | — |
| M63 | A lockfile is generated, never authored | PreToolUse hook | HELD | Agent-only. A hand-edited `package.json` dependency block is not blocked. |
| M64 | The pre-commit gate is never skipped | PreToolUse hook | HELD | Agent-only. Strips quoted text first, so it matches the flag and not a mention of it. |

## Tests and proof

| id | invariant | mechanism of record | status | gap, or what would close it |
|---|---|---|---|---|
| M70 | A unit test has one name, one place, and covers the logic layers only | PreToolUse hook · `check:adherence` 1 · dependency-cruiser | PARTIAL | Three implementations with three separately-maintained package lists. All key on `*.test.*`, so `money-tests.ts` evades every one. The hook fires on `Write` only. |
| M71 | Coverage thresholds land with the slice | vitest `thresholds` | PARTIAL | One glob has a threshold: `packages/domain/src/format/**`. Every other covered path has none. |
| M72 | A test imports `../../src/…`, never `@heliogrid/<pkg>` | — | **NONE** | Review-only. The reason is in `vitest.config.mts`; all five current tests obey it. |
| M73 | The invariants run before a change is called done | `pnpm verify` | PARTIAL | `pnpm check:all` — the command `CLAUDE.md` §5 names for use before a push — omits both the build and `turbo test`, so M12–M14, M17, M18 and M49 never run there. |

## Cross-platform behaviour

| id | invariant | mechanism of record | status | gap, or what would close it |
|---|---|---|---|---|
| M80 | A flow is authored once; screens render and hold no policy (Law 11) | — | **NONE** | No flow exists yet. Closing it: the reference slice, plus `qa-parity` at `/verify` once two screens exist. |
| M81 | A deliberate per-platform difference is recorded | — | **NONE** | Review-only, against `docs/prd/registers/conflicts.md`. |

## Docs and governance

| id | invariant | mechanism of record | status | gap, or what would close it |
|---|---|---|---|---|
| M90 | Every PRD row is dispositioned once; no dangling row, task or screen id | `scripts/gates.py` (about 21 gates) | HELD | Covers `docs/prd/`, `docs/ux/briefs/`, `docs/tasks/` and the registers. Reads no engineering doc and no instruction file. |
| M91 | An engineering doc agrees with the tree it describes | — | **NONE** | Today: two folder-shape blocks in the worker file, a `src/` in `packages/config` that does not exist, "NOT BUILT YET" on two built packages. |
| M92 | An instruction file carries no date, stays within its budget, and makes no enforcement claim without citing a row here | `scripts/gates.py` gates 22, 23, 24 | HELD · red 2026-09-04 | Greps three shapes. It cannot see a war story told without a date, a rule that is merely wrong, or a claim phrased outside the seven matched forms. `mechanisms.md` is exempt from the date check — a date here is the day a gate was proven red. |
