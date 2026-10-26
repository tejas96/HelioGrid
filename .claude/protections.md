# Protections — what holds each one

This file says, for every real protection in this repo, which tool, rule, test or CI step holds it today.
A protection no machine holds says "review": the owner and whoever reviews the change hold it. One nothing holds says "nothing".
A change that adds, moves or removes a holder updates its row here in the same commit.

Where each tool runs: `pnpm lint` runs Biome with its plugins, dependency-cruiser, sherif and turbo
`boundaries`. `pnpm check:all` adds the build, the typecheck, the duplication check, the OpenAPI and
catalog freshness checks with the oasdiff breaking-change judge, the unit tests and the invariants. CI job `quality` runs `pnpm check:all`.

## Tenancy and permissions

| what is protected | what holds it |
|---|---|
| The tenant pin is transaction-local, in the helper and at every `set_config('app.tenant_id', …)` call site | invariant `tenant-pin` |
| A tenant read runs inside the tenant transaction: a repository is given a `TenantPool`, whose `TenantScopedDb` brand nothing else can mint | typecheck (`packages/db/src/client.ts`) · Biome plugin `brand-cast-db` |
| In the api and worker only a `*.repository.ts` reaches `packages/db` or Drizzle, only an `*.admin.repository.ts` the cross-tenant pool, only a `*.reference.repository.ts` the tenant-free one, and no service opens its own pool | dependency-cruiser `db-access-in-repositories-only` · `drizzle-in-repositories-only` · `admin-pool-fenced` · `reference-pool-fenced` · Biome `noRestrictedImports` (`createDb`, the api and worker override) |
| Every table is tenant-scoped (with fail-closed RLS keyed on the tenant), or a global listed with its reason; no partition child is granted; no view or definer function reads past RLS | invariant `table-tenancy-scan` · invariant `tenancy-rls` (its catalog half, `rls-armed.ts`) |
| A session reads and writes only its own tenant's rows, a missing pin fails closed, and an append-only ledger holds no mutating grant — driven as `app_user` over two tenants | invariant `tenancy-rls` (its write paths in `tenancy-write-paths.ts` and `tenancy-files.ts`; its ledger list, each with its reason, in `append-only-ledgers.ts`) |
| Tenant identity never crosses the wire: no `tenantId` in a contract's body, query or path | invariant `tenant-id-on-the-wire` |
| Another tenant's row reads 404, never 403, and every tenant read carries its tenant filter | review |
| Every route declares the access it needs, and a route with no entry is denied | typecheck (`RouteAccessMap` in `apps/api/src/common/auth/access.ts`) · `SessionGuard` bound as `APP_GUARD` (`apps/api/src/app.module.ts`) |
| Every web page sits in one session group — `(door)`, `(open)` or `(inside)` — whose layout is its gate | dependency-cruiser `web-page-sits-in-a-session-group` |
| A permission decision is taken in `packages/domain`: no role name is written outside domain and contracts | Biome plugin `role-literal` · every role against each changed route: review |
| The permission model equals `F2`: both matrices cell for cell, `F2-01`'s twelve presets in order, OR across held roles and widest-wins per domain (`F2-11`, `F2-13`–`F2-15`) | invariant `matrix-mirrors-f2` · unit test `packages/domain/tests/authz/resolution.test.ts` |
| A settings row's public address under `More` is a distinct plain word and never a door's; a role's rows follow the F2 matrix, never a table of their own | unit test `packages/domain/tests/shell/settings-rows.test.ts` · the exhaustive `Record` typecheck of `SETTINGS_ROW_RULE`. A glyph name is a key of `SHELL_GLYPHS` (`ShellGlyphName` is derived from it, so typecheck refuses a name with no drawing), and no icon shape is drawn outside it by Biome plugins `inline-glyph` · `inline-svg-mark`; `Ground.css`'s tiles list is held by review |

## Money

| what is protected | what holds it |
|---|---|
| No device computes a money figure (`F4-04`): no package a phone or browser bundles imports `@heliogrid/domain/server`, and domain's index hands out no function returning `MinorUnits` unless the reviewed list names it | dependency-cruiser `devices-never-compute-money` · unit test `packages/domain/tests/money/device-entry.test.ts` (its type half compiles in domain's typecheck) |
| A brand (`MinorUnits`, `BasisPoints`, `MarketCode` …) is never obtained by a cast outside its owner, and every `unique symbol` brand is enrolled with that check | Biome plugins `brand-cast-domain` · `brand-cast-db` · invariant `brand-registry` |
| Coverage is 100% on domain's `money`, `tax`, `subsidy`, `pricing`, `authz` and `commerce/tranche-allocation.ts` | vitest `thresholds` in `vitest.config.mts` (`pnpm test:unit`) |
| Billing law the compiler holds: an absorbed cost is never a meter (`BM-16`, `BM-24`); only `trialing` and `expired` are non-paying (`BM-03`, `BM-29`); no phase takes away read, export, customer links, billing screens or a device's photos (`BM-32`, `BM-36`); a lapse forfeits price protection and grace does not (`BM-42`) | typecheck (`satisfies` in `packages/domain/src/commerce/costs.ts`; exhaustive `Record`s in `commerce/trial.ts`, `soft-block.ts`, `grandfathering.ts`) · unit tests `isNonPaying`, `isAlwaysOn`, `forfeitsPriceProtection` |
| Pricing law the tests hold: every overage rate clears its worst-case COGS by 40% (`BM-17`); a trial withholds no capability (`BM-28`, `BM-31`); a bundle warns at 80% before any gate (`BM-27`, `BM-34`); a capacity change reaches a protected tenant at once only if it took nothing away (`BM-42`) | unit tests in `packages/domain/tests/`: `pricing/cogs.test.ts`, `trialCapacity` (`pricing/book.test.ts`), `capWarningReached` (`commerce/caps.test.ts`), `appliesImmediately` (`commerce/grandfathering.test.ts`) |
| Minor units only, rounding only in domain's `money/`, and BOM, proposal and tranches agree to the paisa | review |

## Schema and migrations

| what is protected | what holds it |
|---|---|
| An applied migration is never edited, deleted or renamed | the sha256-locked runner (`packages/db/src/migrate.ts`) · CI step `Migrations are append-only` |
| The database matches the code: every pgEnum equals its contract `z.enum` — and so does every vocabulary a CHECK holds because a value outgrew the 63-byte enum label (`file_content_type_known`) — and the Drizzle schema mirrors the tables, columns, nullability and indexes the migrations built | invariants `enum-parity` · `schema-parity` |
| An app writes queries only in its `*.repository.ts` files (and `src/common/db/`, `src/scripts/`, tests), on `packages/db`'s schema and pools | Biome plugin `app-sql` |
| `pnpm db:migrate` migrates only the database the shell names, prints that database before it applies anything, and refuses a URL typed after it | the CLI entry of `packages/db/src/migrate.ts`; no test holds that entry, so its removal is caught by review |
| Every query is index-backed with no N+1 and no `select *`; no derived value is stored; a stored or sent shape is read both ways while a release rolls | review |

## Secrets and environment

| what is protected | what holds it |
|---|---|
| No secret enters the tree | git pre-commit (`gitleaks` on the staged change) · CI step `Secret scan` |
| `process.env` is read only in `packages/env/src`, `apps/web/lib/env.ts`, `vitest.config.mts`, `tests/e2e/playwright.config.ts` and the Temporal spike | Biome `noProcessEnv` (its override names those paths) · a `process` reached by destructuring or an alias: review |
| `.env.example` names every schema variable | invariant `env-example-complete` |
| A secret has no `.default()`, and logs hide personal data | review |
| A service runs with least power: it reads no file of its own (`node:fs`, `fs`) but the worker's bundle check, and its image drops root after the last `FROM` | Biome `noRestrictedImports` (the api and worker override) · invariant `dockerfile-unprivileged` |

## Layering, purity and code shape

| what is protected | what holds it |
|---|---|
| Imports point down: each package reaches only the packages its tag allows, and nothing imports in a cycle | turbo `boundaries` (tags in `turbo.json`) · dependency-cruiser `no-circular` |
| `packages/domain` is pure: no Node builtin, workspace layer or framework; no clock, randomness, timer, network or platform object | dependency-cruiser `domain-purity-no-core-modules` · `domain-purity-no-layers` · `domain-purity-no-frameworks` · Biome plugin `domain-clock` · Biome `noRestrictedGlobals` and `noRestrictedImports` (the domain override) |
| Each lower package stays lean: contracts imports no db, ui or app; db no contracts, ui or app; data no db, ui, theme, i18n or app, with React only under `src/react` and `src/server`; theme nothing in the workspace; a future `packages/adapters` reaches domain only through its index | dependency-cruiser `contracts-lean` · `db-no-upward` · `data-lean` · `data-core-is-framework-free` · `theme-standalone` · `adapters-no-domain-internals` (inert until the package exists) |
| An app imports no other app and reaches a package only through its declared exports; web and mobile never import `packages/db` | dependency-cruiser `no-app-to-app` · `package-index-only` · `web-no-db` · `mobile-no-db` |
| The api and worker take `@heliogrid/i18n`'s React-free root alone — never its `./react` or `./rn` entry | dependency-cruiser `server-no-i18n-frontend-entries` |
| Web and mobile reach the network only through `@heliogrid/data`, and build forms and take `z` only from `@heliogrid/forms` | dependency-cruiser `apps-never-touch-the-wire` · `no-raw-http-clients` · `forms-through-heliogrid-forms` · Biome `noRestrictedGlobals` (`fetch` in `apps/**`) · Biome `noRestrictedImports` (`react-hook-form`, `@hookform/resolvers/zod`, `zod`) |
| The server apps keep their seams: a module reaches another only through its `.public.ts`; `common/` imports no module; Temporal is built only in `common/temporal`; BullMQ never returns; a workflow file imports only `@temporalio/workflow` and pure types | dependency-cruiser `api-module-boundary` · `common-imports-no-modules` · `temporal-client-fenced` · `no-bullmq` · `workflows-are-deterministic` · `workflows-take-no-core-modules` |
| Each app keeps its shape: the web's `app/` routes only, reaching a feature through its barrel and holding no component, and one feature never reaches into another; the phone's `App.tsx` imports no screen, and only a screen reaches `src/screens/shared/` | dependency-cruiser `web-app-imports-feature-barrel-only` · `web-app-holds-no-components` · `web-feature-no-cross-internals` · `mobile-app-entry-thin` · `mobile-shared-parts-are-screens-only` |
| A screen holds no timer and no reducer (Law 11) | Biome `noRestrictedGlobals` (`setTimeout`, `setInterval` in the screen trees) · Biome `noRestrictedImports` (`useReducer` in web and mobile) |
| A vocabulary is declared once: an app exports no string-literal union or constant lookup and writes no enum or magic number; no package copies a list of three or more that contracts or domain declares | Biome plugin `app-vocabulary` · Biome `noEnum` · `noMagicNumbers` (the `apps/**` override) · invariant `vocabulary-copies` |
| Code shape: a file under 300 lines, a web page body under 50 and a phone screen body under 80; no `any`, `!`, `==`, `console.log` or floating promise; duplication never rises | Biome (`noExcessiveLinesPerFile`, `noExcessiveLinesPerFunction`, `noExplicitAny`, `noNonNullAssertion`, `noDoubleEquals`, `noConsole`, `noFloatingPromises`) · `pnpm check:dupes` (jscpd, `.jscpd.json`) |
| Dependency versions agree across every manifest, so `zod` and `react` resolve once; `zod/v4` is never imported | sherif · Biome `noRestrictedImports` (`zod/v4`, `zod/v4-mini`) |
| Each fact sits in its owning package, and logic both platforms need is shared | review |

## UI and accessibility

| what is protected | what holds it |
|---|---|
| Every prop the design system declares for a component is declared by its port | invariant `design-system-props` |
| The pulled design-system tokens equal the census pulled with them, name and value, both ways | invariant `design-system-snapshot` |
| A phone screen passes only props the native half takes, and never reaches a print surface: the phone typechecks the `.native` halves first, and the print parts come only from `@heliogrid/ui/print` | typecheck (`moduleSuffixes` in `apps/mobile/tsconfig.json`; `packages/ui/src/print.ts`) |
| Both halves of a component declare the same role and state for screen readers | review |
| Controls and icons come from `packages/ui`: no icon package, no raw web `button`, `input`, `a`, `select` or `textarea`, no `react-native` control in a phone screen | Biome `noRestrictedImports` (`lucide-react`, `lucide-react-native`; `react-native` in the screens override) · Biome `noRestrictedElements` (web `app/` and `features/`) · in `packages/ui`, Biome plugins `inline-glyph` · `inline-svg-mark` (an icon is a named `SHELL_GLYPHS` shape) |
| A screen's RFC gives every change its frames show a motion row — a design-system motion that joins frames already drawn and keeps `F7-51`'s floors, or one line on why nothing moves — and a moment new to a built screen is the owner's decision | the plan (`/task`, *Plan*) · `code-reviewer`'s Motion row · reduced motion: `qa-live` on the phones and the component specs on the web |
| No raw colour in a UI path, the raw white only on a line whose `biome-ignore` gives the reason, and no size written on a screen | Biome plugins `raw-colour` · `raw-colour-css` · `raw-white` · `raw-white-css` · `screen-size` · `screen-size-css` |
| Every icon-only control has a label, and no accessible label is blank | typecheck (`label` in `IconButton.types.ts`, `children` in `Button.types.ts`, `label` in `OverlayClose.types.ts` and the five overlays' required `closeLabel`) · Biome plugin `empty-label` |
| v1 is light-only: no colour-scheme API, `dark:` or dark scope in code or stylesheets; `color-scheme: only light` on web, Light on iOS and Android, every semantic alias a `var()` chain | Biome plugins `light-only` · `light-only-css` · `light-only-theme-css` · invariant `light-only-platform-files` |
| Every contrast pair meets its WCAG floor | the `packages/theme` build (`assertContrastFloor` in `build.ts`) |
| Every colour `packages/ui` sets on a background in one CSS rule or native style object is a pair `packages/theme/src/contrast.ts` declares; a value no single colour measures is named with its reason | invariant `ui-colour-pairs` (not held — review: a colour whose background another rule or a parent sets; borders and shadows; a native colour not written as `theme.colors…` inside an innermost style object; a tone the caller picks — `Card`'s icon circle, `NextAction`'s avatar) |
| A native view never folds a control out of reach (`accessible`), never carries accessibility props it cannot speak, a named region stays a native view on Android, and a progress bar carries its value | Biome plugins `folded-control` · `inert-a11y` · `folded-region` · `progressbar-value` |
| Words hidden from the eye for a screen reader are hidden one way on the web: `Text`'s `spokenOnly`, the rule written once in `packages/ui/src/primitives/Text/Text.css` | Biome plugin `spoken-only-css` (a copy of the clip rule; off-screen hiding, and the `hg-spoken-only` class written outside `packages/ui`: review) |
| A web landing has no serious or critical axe violation | `expectNoSeriousViolations` (`tests/e2e/support/axe.ts`) in every web spec · CI job `e2e-web` |
| Every tap target is at least 44, no meaning shows only on hover, help text sits in the Explainer, and the screen matches its design | review |
| A web page never scrolls sideways at 375 or 1536, and siblings the brief aligns share the edge it names | `expectNoSidewaysScroll` in every web spec and `expectSharedEdge` in the spec that declares the edge (`tests/e2e/support/layout.ts`) · CI jobs `e2e-web` · `e2e-components` · `qa-live`'s width checks on every screen a change reaches |

## Language

| what is protected | what holds it |
|---|---|
| The commercial document is a Proposal: no *quote*, *quotation* or *quoting*, in any case or spelling | Biome plugins `banned-word` · `banned-word-css` · `banned-word-json` · invariant `banned-word-other-files` |
| The catalogs are freshly extracted | `pnpm check:catalogs` |
| Every UI language is registered: `LANGUAGE_META` and the catalog loaders are `satisfies Record<UiLanguage, …>`; the phone's plural data is not (`docs/tasks/deferred.md`) | typecheck |
| A closed vocabulary's words never merge two members (`F3-12`), and a plural message carries every category its language names | unit tests `packages/i18n/tests/closed-vocabularies.test.ts` · `plural-forms.test.ts` |
| A language is ready (`F3-27`): every character drawn by the sans stack, a static phone face per sanctioned weight in both bundles, Android resolving each family by name; every face ships every weight | invariant `language-fonts` · the `packages/theme` build (`assertWeightsShipped` in `src/font-metrics.ts`) |
| One format implementation, the PRD's own strings — a date's names in the reader's words, its order and digits the pack's — and a compacted amount keeps its disclosure (`F3-19`–`F3-24`) | invariant `format-rendering` |
| Every number the translator prints is in Latin digits, an ICU `#` and a plain `{n}` alike (`F3-21`) | unit test `packages/i18n/tests/runtime.test.ts` |
| The message-template keys equal `F6-26`'s exhaustive list, both ways | invariant `template-keys-mirror-f6` |
| Explicit-id `<Trans id>` only: the Lingui macro is never imported | Biome `noRestrictedImports` (`@lingui/macro`, `@lingui/react/macro`) |
| Every visible word comes from `i18n` in all three languages, and kW, kWh and kWp are never translated | review |

## The API and the wire

| what is protected | what holds it |
|---|---|
| The committed OpenAPI equals what the contract emits | `pnpm check:openapi` |
| A breaking change to the API's shape is refused; a set that grows by design is `x-extensible-enum`; the client-upgrade 426 is on every operation and judged too | `pnpm check:openapi` — oasdiff against the branch's base on `origin/main`, the build CI installs by version and sha256, refused at any other version |
| Every non-2xx response is the canonical envelope, and a response that breaks its contract answers `INTERNAL` | `apps/api/src/common/filters/envelope-exception.filter.ts` · `validateResponses: true` (`apps/api/src/app.module.ts`) |
| A status a route throws is one its contract declares, or it answers `INTERNAL` and the log names the route and the status | `apps/api/src/common/filters/declared-statuses.ts` · unit test `apps/api/tests/common/undeclared-status.test.ts` |
| A framework exception's generic code is chosen explicitly | typecheck (the unexported status map; `httpStatusFor` and `genericErrorCodeByStatus` in `packages/contracts/src/error.ts`) |
| Every route that answers 201 declares `idempotency-key`, and each create finds its retry | unit tests `packages/contracts/tests/create-retry-key.test.ts` · `apps/api/tests/*/retried-*.test.ts` |
| An audited `PUT` or `PATCH` sent again with what is stored writes, records and moves nothing; every `PUT` and `PATCH` route is proven so or listed with its reason | unit test `apps/api/tests/settings/unchanged-replace.test.ts` (its census reads `DECLARED`, `apps/api/src/common/filters/declared-statuses.ts`) |
| Every route declares each `:segment` of its path in `pathParams`, takes no union as its body, query or path, and carries the shared 400, 403 and 500 (`sharedRefusals`, `packages/contracts/src/error.ts`) without copying one | unit test `packages/contracts/tests/route-shape.test.ts` |
| The transport tells the session store when a refresh could not save a call | typecheck (`SessionSignals` required in `packages/data/src/transport/transport.ts`) |
| Every notification type is registered with who raises it, who receives it, its channels and its urgency | typecheck (`NOTIFICATION_REGISTRY: Record<NotificationType, …>` in `packages/domain/src/notifications/registry.ts`) |
| The worker resolves its workflows: each type name equals its exported function, the bundle's one entry (`src/worker.workflows.ts`) re-exports it, and the bundle is found when run from source | typecheck (both `satisfies` in each `<area>.public.ts`) · unit test `apps/worker/tests/temporal/workflow-bundle.test.ts` |
| A step the api runs and the workflow that calls it agree on its name and shape | typecheck (the activity interface in `@heliogrid/contracts/workflows`, implemented by the api and proxied by the worker) |
| A product change hands work to Temporal only through an outbox row in its own transaction, and a retried dispatch never starts a second run | unit test `apps/api/tests/orchestration/outbox-handoff.test.ts` · invariant `tenancy-rls` (the outbox in `append-only-ledgers.ts`) · a module starting a workflow without its row: review |
| The contract is not bypassed: no hand-written wire type, raw HTTP call or hard-coded enum value | review |

## Tests and regression

| what is protected | what holds it |
|---|---|
| A unit test is `<package>/tests/**/*.test.ts` in a package `unit-test-packages.json` names; a `*.spec.*` lives only where the e2e runners read it | dependency-cruiser `no-tests-outside-the-tests-tree` · the vitest `include` (both read `packages/config/unit-test-packages.json`) |
| Every web route and phone screen has its regression flow, by file name; `tests/e2e/mobile/run.sh` runs every top-level phone flow, and every `steps/` flow is called | invariant `e2e-flow-per-screen` |
| Every Biome plugin file exists, and every folder its globs name exists | invariant `biome-plugin-scopes` |
| The invariants run against a real database, and fail closed in CI without one | CI job `quality` (`tests/invariants/src/run.ts`) |
| The api tests never run against `heliogrid_dev`: off CI they are collected only when both database URLs name `heliogrid_test` and are skipped with a warning otherwise; whenever they are collected (as with `CI` set) a URL naming `heliogrid_dev` throws before collection | `vitest.config.mts` (the guard; seen red on `heliogrid_dev` once) |
| The invariants never run against `heliogrid_dev`: their database checks write seed rows | `tests/invariants/src/run.ts` (the guard; seen red on `heliogrid_dev` once) |
| The web flows never run against `heliogrid_dev`: off CI they refuse to start unless both database URLs name `heliogrid_test`, and never reuse a server already listening | `tests/e2e/playwright.config.ts` (the guard; seen red with no database URLs) |
| The regression suite runs on what a change reaches, in CI: the web flows and component tests, the phone's JavaScript bundle, both native builds, and the phone flows on an Android emulator; the iOS flows run by hand (`test:mobile` on a simulator), never in CI; `qa-live` runs them on the simulator for each task. The repository variable `PHONE_E2E=off` switches the Android flows off, and no check holds that: while it is set, nothing proves them | CI jobs `e2e-web` (the web flows) · `e2e-components` (the component tests; it blocks a merge only once the owner adds it to `main`'s required checks) · `mobile-js` · `android` (lane `phone_e2e`) · `ios` (the build) |
| Each rule is tested at its edges; each proof would fail without its fix; a money, tenancy or permission test, and a check a change adds or alters, is seen to fail once | review |

## Agent safety

| what is protected | what holds it |
|---|---|
| An agent never writes the database directly; schema uses migrations and test/development data goes through application or API journeys | review — CLAUDE.md §8; `qa-live` forbids direct database access |
| An agent never edits a lockfile | CI's `pnpm install --frozen-lockfile` · `.claude/settings.json` denies edits to `pnpm-lock.yaml` in Claude Code (`Edit` covers every file-editing tool) |
| An agent never pushes to `main`, never force-pushes, never skips git's pre-commit hook, and never merges or approves a pull request | `.claude/settings.json` denies in Claude Code `git push --force`, `-f`, a `+` refspec and a push naming `main`; `git commit --no-verify`, `-n` and `SKIP_SIMPLE_GIT_HOOKS`; `gh pr merge`, `gh pr review` and a merge through `gh api` (a commit message carrying ` -n ` is denied too, and is reworded) · a spelling the list misses: review. GitHub does not hold it: `main` requires the checks `changes`, `quality`, `e2e-web`, `mobile-js`, `android` and `ios` but no review, and an admin — the agent works with the owner's admin token — bypasses them |
| An agent never wipes a product volume or kills by port/process name; a foreign dev listener is freed only through `clean-dev-ports` | CLAUDE.md §5 (the ports and `clean-dev-ports`; no instruction in this repo names the product volumes) · `.claude/settings.json` denies its listed destructive command forms in Claude Code as defense in depth, not every shell spelling · another client: review |
| A helper agent edits no repository file and starts, stops or builds no server; `qa-live` restarts only the HelioGrid app | the contract of each `.claude/agents/*.md` · review |
| Every server, phone and browser tab a task started is stopped, and every temporary file it made is deleted, before the gate runs; what was running before the task is left as found, except an api or web it holds, which is stopped for the seed and the gate and started again | review — `/task`, *Run the app* and *Clean up* |
| An agent's network writes | nothing |
| No screenshot and no picture read, in Main or in an agent: a screen is proven by its tree and its measured values | `.claude/hooks/no-screenshot.py` (PreToolUse, `.claude/settings.json`) · a form the hook misses: review |
| A check, build or test run writes to `.qa/<name>.log`, and the chat reads only its failures | `.claude/hooks/long-output.py` (PreToolUse, `.claude/settings.json`) · a command form the hook misses: review |

## Process

| what is protected | what holds it |
|---|---|
| Every commit passes Biome on its staged files, the secret scan and a typecheck of every package (turbo-cached) | git pre-commit (`simple-git-hooks` → `pnpm run precommit`) |
| Every pull request passes the full check on Linux | CI job `quality` (step `Quality gate`) |
| Nothing reaches `main` without the owner: every PR is merged by the owner | `.claude/settings.json` denies a force push, a push to `main`, `gh pr merge`, `gh pr review` and a merge through `gh api` |
| The build order is whole: every task file sits in a block or is wholly V2, every task placed apart exists, every `(all but …)` exclusion is placed by another block's row, no open task waits on another in a loop or on a struck task, a V1 task waits on no V2 one, a V1 task waiting on a later block is recorded and its ruling is owed before its block opens, and every V1 screen task names its screen | invariant `build-order-holds` |
| Every task id is defined once with exactly one `**Status:**` line, outside fenced examples and the registers | the task reader `task-ledger.ts`, through the invariants that read it |
| Every PRD row a task file, brief, PRD document or register cites is live — a lettered clause (`F2-08a`) counts when its row is — save inside a dated removal record, a brief's amendment footnote or a struck register row; every quote of a row in a task file or brief is its cell, a cut of it or the cell plus a suffix, a shipped or struck task's quotes excepted | invariant `prd-rows-cited` |
| The RFC being built holds its own proofs: every test a `main-dev` proof row names exists in the file it names, and every row its `**Deleted:**` line lists is gone from `docs/tasks/deferred.md` — read for RFC sections that differ from `origin/main` | invariant `rfc-proofs-hold` |
| Every capability a task file or brief cites is one the matrix holds: an `<area>.<name>` id (never a module code such as `m01.`, never a capability's name under another area) or an `F2.<module>.<name>` row key of the capability or visibility matrix | invariant `capability-ids-cited` |
| The screens register is whole: every screen has exactly one brief file and at least one task whose DESIGN line names it, and nothing briefs or designs a screen it does not hold; every live PRD row lands exactly once in §3, a struck or deleted row is struck there, and no landing names a row the PRD never had; every screen is V1 or V2, in the counts the scope lock states | invariant `screens-register-whole` |
| The next step is the one the build order picks, and every open point the session decides is written in the plan with its reason | review — `/task`, *Pick* and *Plan* |
| The diff is reviewed in a fresh context, and the change is checked live on every surface it reaches, before the PR opens | the `code-reviewer` and `qa-live` agents — `/task`, *Review and live QA* |
| Every acceptance line has its owner and a passed proof before the commit, and a PR is marked ready only when every CI job it needs ran and passed | the PR body's `Acceptance criteria → proof` table, filled from the test logs and the `qa-live` report · invariant `rfc-proofs-hold` (the `main-dev` rows) · the draft PR marked ready by `/task`, *Ship* · review |
| A doc the change made wrong is fixed in the same change | review |
| Every `docs/tasks/deferred.md` row a task meets is shown in its RFC as join or stays, and a row it joins is gone before its commit | review — `/task`, *Plan* · invariant `rfc-proofs-hold` (the `**Deleted:**` half) |
| A board is checked against its brief, PRD rows, laws and components, and locked, before the first task that builds or serves it; a board or a support file it loads changed, added or removed on the canvas after the lock, or a new design system version installed on it, sends it back to the check | the board check (`.claude/skills/task/design-track.md`, `board-check.md`, one agent per screen) and the owner's review on the canvas · the committed copy in `.design/<module>/` and its `design-system.version`, compared by `/task`, *Pick*, with a fresh read |
| A screen task's build matches its board | review — `code-reviewer`'s Board row (the locked board's code against the screen's code, `.claude/rules/ui-adherence.md` *A screen is its locked board*) · the component specs (`tests/e2e/components`) · the QA agents' measured checks on every screen a row reaches |
