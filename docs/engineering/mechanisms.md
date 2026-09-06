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
| M19 | Migrations are append-only | PreToolUse hook · sha256-locked runner · CI diff guard | HELD | Three independent layers. The hook sees Edit and Write only — a Bash write is not seen; the runner and CI cover everyone, Bash included. |
| M20 | An agent never writes to the database | PreToolUse hook | HELD · red 2026-09-06 | Sees the client at a command position or behind `docker exec`, `sudo`, `npx`, `pnpm exec` and `pnpm --filter … exec`, and `push`/`migrate` on drizzle-kit. `psql -f file.sql` and any node script still evade it. |

## Contracts and the wire

| id | invariant | mechanism of record | status | gap, or what would close it |
|---|---|---|---|---|
| M25 | The committed OpenAPI matches the contract | `check:openapi` (rebuild, re-emit, byte compare) | PARTIAL | `.refine()` and `.transform()` are dropped by the generator, so a real narrowing emits an identical spec. |
| M26 | A breaking API change is judged before it merges | `check:openapi` + `oasdiff` | HELD · red 2026-09-06 | Under `CI` an absent `oasdiff`, a compare that cannot run, or an unfetched base fails closed; locally each is a labelled skip. The workflow pins the binary by version and checksum. Judges only what the emitted spec carries, so the M25 gap (a dropped `.refine()`) is invisible here too. |
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
| M45 | User-visible copy goes through Lingui | `check:adherence` 6 | HELD · red 2026-09-04 | Now scans `packages/ui/src` too. 18 existing files are listed as debt and each is rot-checked, so a deleted one breaks the gate; a NEW file gets no grace. Two gaps: the exemption is per FILE, so a second literal in a debt file passes, and the heuristic reads JSX text nodes only — the 178 English DEFAULT PROPS are invisible to it. `M50` is the real fix. Scans `.tsx` only under `packages/ui/src`: a default string in a `.ts` model file, `DocumentPreview`'s sample labels among them, is not seen. |
| M46 | Every extracted message is actually translated | `check:adherence` 7 | HELD | Catches an empty `msgstr`, which `lingui extract` cannot see. |
| M47 | The catalogs are freshly extracted | `check:catalogs` | HELD | Freshness only. A literal that was never extracted has no entry to go stale (that is M45's job). |
| M48 | Every contract UI language is fully registered | types (`satisfies Record<UiLanguage, …>`) · `check:adherence` 9 | HELD | Derives its expectation from `locale.ts` instead of restating the list. The model row for how to write a check. |
| M49 | One format implementation, and the PRD's exact strings ship | invariant `format-rendering` (static) | HELD | Knows `new Intl.*` only — a hand-rolled grouping loop or `toLocaleString()` is invisible. Enumerates with `git ls-files`, so an untracked file is exempt. |
| M50 | A UI component holds no user-visible English | — | **NONE** | `packages/ui` cannot import `packages/i18n` (its boundary tag allows contracts, domain, theme and config only), so no prop can be typed as translated copy. Closing it: declare the `TranslatedText` brand in `contracts`; `i18n` stays the only constructor. `docs/tasks/UI.md` carries the plan and now names the right home. |

## Code shape

| id | invariant | mechanism of record | status | gap, or what would close it |
|---|---|---|---|---|
| M55 | Formatting; no `any`, `!`, `==` or `console.log` | biome | HELD | `console.error`/`warn` allowed; the rule is off for scripts and invariants by name. |
| M56 | A source file stays under ~300 lines | biome `noExcessiveLinesPerFile` | HELD | Counts CODE lines. Configs and `docs/engineering/harness/**` are excluded by name. |
| M57 | `packages/domain` is pure: no clock, randomness or I/O | dependency-cruiser purity · `check:adherence` 4 | HELD | The grep names nine shapes; `Date.UTC` is not among them. |
| M58 | An app declares no enum, union, lookup or policy number | biome `noEnum` · `noMagicNumbers` · `check:adherence` 10 | HELD · red 2026-09-03 | Apps only, and EXPORTED declarations only. A package may declare freely. |
| M59 | A query lives in `packages/db` | `check:adherence` 10c (SQL verbs in an app) | PARTIAL | Catches a literal SQL verb in an app. Index-backed, no N+1 and no `select *` are review-only. |
| M60 | A shared fact is unspeakable outside its owner; never `as <Brand>` | `check:adherence` 10b | PARTIAL · red 2026-09-06 | Fires only for a brand listed by hand in the script's `BRANDS` registry, which exempts the owning PACKAGE prefix (`packages/domain/` for the market brands). A brand declared and not listed there is unguarded, so listing it is part of landing it. Enumerates with `git ls-files`, so an untracked file is exempt. |
| M61 | Duplication never increases | `check:dupes` (jscpd) | HELD · red 2026-09-04 | `threshold` is a PERCENTAGE, not a line count; it was 12 and is now 2.38, immediately above today's 2.37%. So it is a RATCHET, not the zero-duplication rule: the 99 existing clones stay, and any addition fails. Driving it to 0 is separate work and an owner call. jscpd also reads several files under two formats at once, so the denominator is inflated and the true figure is higher. |
| M62 | Dependency versions agree across every manifest | sherif | HELD | — |
| M63 | A lockfile is generated, never authored | PreToolUse hook | HELD | Edit and Write only — a Bash write is not seen; CI's frozen-lockfile install is the backstop. A hand-edited `package.json` dependency block is not blocked. |
| M64 | The pre-commit gate is never skipped | PreToolUse hook | HELD | Agent-only. Strips quoted text first, so it matches the flag and not a mention of it. |

## Tests and proof

| id | invariant | mechanism of record | status | gap, or what would close it |
|---|---|---|---|---|
| M70 | A unit test has one name, one place, and covers the logic layers only | PreToolUse hook · `check:adherence` 1 · dependency-cruiser | PARTIAL | Three implementations with three separately-maintained package lists. All key on `*.test.*`, so `money-tests.ts` evades every one. The hook fires on `Write` only. |
| M71 | Coverage thresholds land with the slice | vitest `thresholds` | PARTIAL · red 2026-09-06 | Eight globs have a threshold, all at 100%: `calling/**`, `certification/**`, `format/**`, `market/**`, `money/**`, `rails/**`, `subsidy/**` and `tax/**` under `packages/domain/src/`. Every other covered path has none. |
| M72 | A test imports `../../src/…`, never `@heliogrid/<pkg>` | — | **NONE** | Review-only. The reason is in `vitest.config.mts`; all five current tests obey it. |
| M73 | The invariants run before a change is called done | `pnpm verify` · `pnpm check:all` | HELD | `check:all` now ends with `pnpm turbo test`, so the static invariants (`M14`, `M49`) run during the work and the db-backed ones skip loudly. It costs nothing extra: `turbo typecheck` already builds. |

## Cross-platform behaviour

| id | invariant | mechanism of record | status | gap, or what would close it |
|---|---|---|---|---|
| M80 | A flow is authored once; screens render and hold no policy (Law 11) | — | **NONE** | No flow exists yet. Closing it: the reference slice, plus `qa-parity` at `/verify` once two screens exist. |
| M81 | A deliberate per-platform difference is recorded | — | **NONE** | Review-only, against `docs/prd/registers/conflicts.md`. |

## Docs and governance

| id | invariant | mechanism of record | status | gap, or what would close it |
|---|---|---|---|---|
| M90 | Every PRD row is dispositioned once; no dangling row, task or screen id | `scripts/gates.py` (about 21 gates) | HELD | Covers `docs/prd/`, `docs/ux/briefs/`, `docs/tasks/` and the registers. Reads no engineering doc and no instruction file. |
| M91 | An engineering doc agrees with the tree it describes | — | **NONE**, and deliberately so | A path-existence grep over `docs/` was written and rejected: of 217 candidate dead paths, nearly all were legitimate — a relative reference resolving from another tree, or an ADR correctly naming a file it recorded the deletion of. A gate with that false-positive rate gets muted, and a muted gate catches nothing. The instances found by hand are fixed; the class stays under review. |
| M92 | An instruction file carries no date, stays within its budget, and makes no enforcement claim without citing a row here | `scripts/gates.py` gates 22, 23, 24 | HELD · red 2026-09-04 | Greps three shapes. It cannot see a war story told without a date, a rule that is merely wrong, or a claim phrased outside the seven matched forms. `mechanisms.md` is exempt from the date check — a date here is the day a gate was proven red. By owner decision it scans no `.claude/skills` or `.claude/agents` file. |
| M93 | An agent never pushes to `main` and never force-pushes | PreToolUse hook `block-main-push.sh` | HELD · red 2026-09-06 | Agent-only by nature: a shell action no type or lint rule can see, which is the owner ruling that admitted the script. GitHub's branch rule is the backstop for everyone and binds administrators only once that setting is on. Reads the checked-out branch for a bare `git push`. |
| M94 | A comment states the constraint, never the date it was learned | `check:adherence` 12 | HELD · red 2026-09-06 | Sees `//`, `*` and `#` comment lines and trailing comments in every tracked source, script, config and workflow file outside `docs/` and generated trees. A quoted date is an example value and passes. Not seen: a docstring, a string field that reads as a comment (dependency-cruiser's `comment:`, a gate's printed message), a date written without hyphens. |
