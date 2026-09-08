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
| M39 | A component mounts on both platforms | — | **NONE** | A render harness existed and nothing ran it, so it was deleted. A component is proven mounted by the screen that uses it, driven by `/verify`'s surface agents; a component no screen uses yet is unproven, and that is stated rather than hidden. |
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
| M56 | A source file stays under ~300 lines | biome `noExcessiveLinesPerFile` | HELD | Counts CODE lines. Configs are excluded by name. |
| M57 | `packages/domain` is pure: no clock, randomness or I/O | dependency-cruiser purity · `check:adherence` 4 | HELD | The grep names nine shapes; `Date.UTC` is not among them. |
| M58 | An app declares no enum, union, lookup or policy number | biome `noEnum` · `noMagicNumbers` · `check:adherence` 10 | HELD · red 2026-09-03 | Apps only, and EXPORTED declarations only. A package may declare freely. |
| M59 | A query lives in `packages/db` | `check:adherence` 10c (SQL verbs in an app) | PARTIAL | Catches a literal SQL verb in an app. Index-backed, no N+1 and no `select *` are review-only. |
| M60 | A shared fact is unspeakable outside its owner; never `as <Brand>` | `check:adherence` 10b | PARTIAL · red 2026-09-06 | Fires only for a brand listed by hand in the script's `BRANDS` registry, which exempts the owning PACKAGE prefix (`packages/domain/` for the market brands). A brand declared and not listed there is unguarded, so listing it is part of landing it. Enumerates with `git ls-files`, so an untracked file is exempt. |
| M61 | Duplication never increases | `check:dupes` (jscpd) | HELD · red 2026-09-04 | `threshold` is a PERCENTAGE, not a line count; it was 12 and is now 2.38, immediately above today's 2.37%. So it is a RATCHET, not the zero-duplication rule: the 99 existing clones stay, and any addition fails. Driving it to 0 is separate work and an owner call. jscpd also reads several files under two formats at once, so the denominator is inflated and the true figure is higher. |
| M62 | Dependency versions agree across every manifest | sherif | HELD | — |
| M63 | A lockfile is generated, never authored | PreToolUse hook | HELD | Edit and Write only — a Bash write is not seen; CI's frozen-lockfile install is the backstop. A hand-edited `package.json` dependency block is not blocked. |
| M95 | No price is produced by converting another market's book (`F1-26`) | — | **NONE** | Review-only, and nothing can hold it: the invariant is the ABSENCE of a conversion — no type forbids a function nobody wrote, and a grep for `rate`, `fx` or `convert` over a money package is all false positives. `PriceBookPack` carries no exchange-rate field, so a converter would have to be authored deliberately. Closing it: nothing proposed. |
| M96 | Every overage rate sits ≥40% above its worst-case unit COGS (`BM-17`) | unit `metersBelowCogsFloor` | HELD · red 2026-09-07 | Judges what a BOOK authored, per rate and per marketing channel. A market whose book nobody tests is unguarded: this is a unit test over `IN_PRICE_BOOK`, not a scan of every book that will exist. `WorstCaseCogs` sits ON the rate, so a rate cannot be authored without the figure that makes it judgeable — that half is the type's. |
| M97 | An absorbed cost is never also a meter (`BM-16`, `BM-24`) | `satisfies readonly Exclude<…, Meter>[]` | HELD · red 2026-09-07 | A compile error, not a test. Holds one direction only: it stops a METER being absorbed, and nothing stops a new meter being added whose name is already absorbed — the collision is caught, whichever list moved. `NEVER_METERED`, `PROXIED_UPSTREAMS` and `FREE_UPSTREAMS` carry no such guard; they name capabilities and upstreams, not meters. |
| M98 | Only `trialing` and `expired` are reachable without paying (`BM-03`, `BM-29`) | unit `isNonPaying` over `BILLING_STATES` · exhaustive `Record<BillingState, boolean>` | HELD · red 2026-09-07 | Two halves: the `Record` makes a seventh state a compile error, and the test makes a misclassified one a failure. Neither can see a free tier opened outside this map — a screen that simply never checks the state is review-only until `T-M12-008`'s entitlement engine is the single gate. |
| M99 | A trial withholds no capability to bound cost (`BM-28`, `BM-31`) | unit `trialCapacity` | HELD · red 2026-09-07 | Holds the two `unlimited` rungs and that the caps are re-read from the book. It cannot see a capability withdrawn somewhere OTHER than this shape — a screen that hides a feature from a trialing tenant is `T-FCORE-014`'s matrix and review. |
| M100 | No billing phase takes away read, export, customer links or billing screens (`BM-32`), nor a photo already on a device (`BM-36`) | unit `isAlwaysOn` over `BILLING_PHASES` · nested exhaustive `Record` | HELD · red 2026-09-07 | Holds the MATRIX and every cell in it: an eighth phase or a thirteenth capability is a compile error, and a moved ✓ is a failure. It cannot see a gate that never consults the matrix, or a screen that hides a button — those are `T-M12-009` and review. `isAlwaysOn` is derived from the matrix rather than a second list, so the promise and the table cannot disagree. |
| M101 | A bundle discloses at 80% before any gate fires (`BM-27`, `BM-34`) | unit `capWarningReached` | HELD · red 2026-09-07 | Holds the threshold and its edges — the boundary, a zero bundle, and the two limits that carry no number. It cannot see the usage SCREEN failing to render the warning, which is `T-M12-004`'s and `M12-02`'s no-second-definition rule. |
| M102 | A lapse forfeits price protection, and the grace window does not (`BM-42`) | unit `forfeitsPriceProtection` over `BILLING_STATES` · exhaustive `Record<BillingState, boolean>` | HELD · red 2026-09-07 | The `Record` makes a seventh state a compile error; the test catches a misclassified one. It cannot see `M12` billing a lapsed tenant at the old row anyway, nor the cancellation and dunning copy that `BM-42` requires say the forfeiture out loud — `M12-57` and review. |
| M103 | A capacity change reaches a protected tenant at once only if it took nothing away (`BM-42`) | unit `appliesImmediately` | HELD · red 2026-09-07 | Compares CAPACITY only: `BM-42` grants the immediate path to caps and bundles and says nothing about price, so no price is read and none is guarded. A `custom` rung can never be proven generous and so always waits — deliberate, not a gap. |
| M64 | The pre-commit gate is never skipped | PreToolUse hook | HELD | Agent-only. Strips quoted text first, so it matches the flag and not a mention of it. |

## Tests and proof

| id | invariant | mechanism of record | status | gap, or what would close it |
|---|---|---|---|---|
| M70 | A unit test has one name, one place, and covers the logic layers only | PreToolUse hook · `check:adherence` 1 · dependency-cruiser | PARTIAL | Three implementations with three separately-maintained package lists. All key on `*.test.*`, so `money-tests.ts` evades every one. The hook fires on `Write` only. |
| M71 | Coverage lands with the slice, at 100% per slice | vitest `thresholds` | PARTIAL · red 2026-09-07 | The rule: every logic-package path with a runtime reader carries a 100% bar the moment its slice lands, and the bar is a glob per folder or, where a folder still holds vocabularies nobody consumes, per file. What carries no bar today, and why: `packages/domain/src/auth/`, `authz/` and `tenancy/` (their slices have not landed); `commerce/states.ts` and `costs.ts` (closed vocabularies with no reader until `M12` consumes them — `all: true` scores a reader-less file 0%, so a folder bar there would buy an import-only test). A folder-derived list was considered and refused: it would only invert into this exceptions list. |
| M72 | A test imports `../../src/…`, never `@heliogrid/<pkg>` | — | **NONE** | Review-only. The reason is in `vitest.config.mts`; all five current tests obey it. |
| M73 | The invariants run before a change is called done | `pnpm verify` · `pnpm check:all` | HELD | `check:all` now ends with `pnpm turbo test`, so the static invariants (`M14`, `M49`) run during the work and the db-backed ones skip loudly. It costs nothing extra: `turbo typecheck` already builds. |

## Cross-platform behaviour

| id | invariant | mechanism of record | status | gap, or what would close it |
|---|---|---|---|---|
| M80 | A flow is authored once; screens render and hold no policy (Law 11) | — | **NONE** | No flow exists yet. Closing it: the reference slice, plus `qa-parity` at `/verify` once two screens exist. |
| M81 | A deliberate per-platform difference is recorded | — | **NONE** | Review-only; the difference is recorded in the owning PRD row. |

## Docs and governance

| id | invariant | mechanism of record | status | gap, or what would close it |
|---|---|---|---|---|
| M90 | Every PRD row is dispositioned once; no dangling row, task or screen id | `scripts/gates.py` (about 21 gates) | HELD | Covers `docs/prd/`, `docs/ux/briefs/`, `docs/tasks/` and the screens register. Reads no engineering doc and no instruction file. |
| M91 | An engineering doc agrees with the tree it describes | — | **NONE**, and deliberately so | A path-existence grep over `docs/` was written and rejected: of 217 candidate dead paths, nearly all were legitimate — a relative reference resolving from another tree, or an ADR correctly naming a file it recorded the deletion of. A gate with that false-positive rate gets muted, and a muted gate catches nothing. The instances found by hand are fixed; the class stays under review. |
| M92 | An instruction file carries no date, stays within its budget, makes no enforcement claim without citing a row here, and names no tool | `scripts/gates.py` gates 22, 23, 24, 25 | HELD · red 2026-09-07 | Greps four shapes; gate 23's pass line prints the files nearest their ceiling. It cannot see a war story told without a date, a rule that is merely wrong, a claim phrased outside the seven matched forms, or a tool named by a word outside its list (`coverage threshold`, never the bare word, which is tax vocabulary). Frontmatter is exempt: a rule's `paths:` block names configs. `mechanisms.md` is exempt from the date check — a date here is the day a gate was proven red. By owner decision it scans no `.claude/skills` or `.claude/agents` file. |
| M93 | An agent never pushes to `main` and never force-pushes | PreToolUse hook `block-main-push.sh` | HELD · red 2026-09-06 | Agent-only by nature: a shell action no type or lint rule can see, which is the owner ruling that admitted the script. GitHub's branch rule is the backstop for everyone and binds administrators only once that setting is on. Reads the checked-out branch for a bare `git push`, and only the SUBCOMMAND after `git`, so `git stash push` is not a push. |
| M94 | A comment states the constraint, never the date it was learned | `check:adherence` 12 | HELD · red 2026-09-06 | Sees `//`, `*` and `#` comment lines and trailing comments in every tracked source, script, config and workflow file outside `docs/` and generated trees. A quoted date is an example value and passes. Not seen: a docstring, a string field that reads as a comment (dependency-cruiser's `comment:`, a gate's printed message), a date written without hyphens. |
| M104 | A test never restates a constant — the subject of an `expect` is an outcome | `check:adherence` 13 | HELD · red 2026-09-07 | Sees `expect(UPPER_CASE).` in every tracked `*.test.ts` under a `tests/` folder. Not seen: a constant bound to a lower-case name first, a table of literals that mirrors a source without importing it (the `cogs.test.ts` shape, review-only), or a `toEqual` against a copied object. |
| M106 | One ledger: a task is `planned`, `designed` or `shipped (#PR)`, its screens say the same, and a shipped id is in `main`'s history | `scripts/gates.py` gate 27 | HELD · red 2026-09-08 | Reads the `Status:` line of every task block and the `Status` column of `screens.md`; `planned` with every DESIGN link filled, `designed` with a PENDING link, a screen that disagrees with its task, and a `shipped` id that `origin/main`'s subjects never name all fail. It cannot see a PR that merged without naming its task, nor a screen designed against a stale brief — those are `/ship`'s done-when table and review. |
| M107 | `docs/engineering/` only shrinks — every file there carries its fate at its top, and the folder dissolves into the package files and the tasks | `scripts/gates.py` gate 28 | HELD · red 2026-09-08 | The ceiling is the folder's exact line count; growth fails, and a cut fails until the ceiling is lowered in the same change, so the number can only fall. It counts lines, not truth: a file can shrink by losing what was still true, which is the fate line's job and review's. |
| M105 | A commit waits for the owner's yes, given in chat to the shown file list and message | — | **NONE** | Review-only, and by owner decision it stays so: in the harness's default permission mode `git commit` is not allowlisted, so the app itself asks before each one; in bypass mode nothing asks. A marker-file hook was refused — the agent's own shell could write the marker, so it would be a reminder, not a gate. |
