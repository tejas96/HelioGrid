# Landmines — live traps only

A trap that is real TODAY, that no type, lint rule or invariant can hold, and that costs an hour
when you meet it cold. One line each, grouped by where it bites.

**What does not belong here.** A rule (`CLAUDE.md`) · a mechanism (`mechanisms.md`) · a fact the
tree already states · anything about code that no longer exists · the story of how the trap was
found, which belongs in the commit that added the line.

**Every entry carries a retire-when.** A trap with no retirement is a trap nobody will ever
delete. `never` means it is upstream behaviour we do not control. Law 8's deletion sweep covers
this file: when the path goes, the row goes.

## Workspace

| trap | fix | retire when |
|---|---|---|
| A deleted source file leaves a stale `dist/`, so `boundaries` stays red on code that is gone. | `pnpm turbo build --force` | never |
| In zsh a bare glob matching nothing aborts the whole command and prints nothing — it reads as "clean". | Enumerate with `git ls-files`. | never |
| `zod` must resolve to ONE 3.25.x instance. Otherwise pnpm gives ts-rest's peer a zod 4 and the typed client silently collapses to `never`. | The pin in every manifest; `sherif` compares them. | a `pnpm.overrides` entry replaces the per-manifest pins |
| dependency-cruiser resolves a workspace import through the target's `dist/`, so before a build every dist-targeting rule reports clean. | Build before you cruise. `pnpm verify` already does. | never |

## apps/api

| trap | fix | retire when |
|---|---|---|
| `pnpm dev` runs tsx (esbuild), which emits NO decorator metadata: an implicit constructor param fails at boot. | Explicit `@Inject(Token)` on EVERY param, `Reflector` and class providers included. | dev stops using esbuild |
| A route declaring a NON-base error code silently ships the wrong code: the envelope filter reverse-maps status→code, and both sides compile. | Throw `ContractException` with that literal code AND an explicit `HttpStatus`. | per-route error-code typing lands with the first M01 contract |
| `redact` reaches structured fields only — `req.query.phone` is censored while the same value inside the raw `req.url` string is not. | `logging.ts` strips the query string from the logged URL. A new PII field needs a path there. | never |
| A ts-rest `RequestValidationError` carries the submitted data, and some Zod issue codes include the VALUE. | `logging.ts` serialises errors through an ALLOWLIST. Never turn it into a denylist. | never |
| `flyctl deploy` needs the workspace lockfile. | Build from the repo root. | never |

## apps/web

| trap | fix | retire when |
|---|---|---|
| A feature barrel mixing a Server Component and a `'use client'` screen attaches that client chunk to EVERY page reaching the barrel; tree-shaking cannot remove it. Symptom: two routes reporting identical First Load JS. | Give the client screen its own barrel. | never — it is how Next builds |
| `turbo build`, `pnpm verify` or `rm -rf */dist` while `next dev` is live 404s every chunk: unstyled HTML plus `undefined (reading 'call')`. Looks like a code bug. | Kill 3002, `rm -rf apps/web/.next`, restart. | never |
| `"sideEffects": ["**/*.css"]` in `package.json` is load-bearing: without it webpack keeps every module a barrel names. True only while every side-effect import under `apps/web` is CSS. | Keep the declaration; recheck if a non-CSS side-effect import lands. | never |
| `lib/env.ts` must write `process.env.NEXT_PUBLIC_*` out LITERALLY — Next substitutes text, so `process.env[key]` or a spread reads `undefined` in the browser and falls back to the schema default with nothing failing. | Literal reads only. | never |
| Stylesheet import order in `layout.tsx` is load-bearing: tokens before base before globals. | Keep the order. | never |

## apps/mobile

| trap | fix | retire when |
|---|---|---|
| `import()` is not usable for lazy loading: against the dev server it goes through `__loadBundleAsync` and throws `LoadBundleFromServerError`, while a release build inlines it. | A `.native.ts` half, as `i18n/catalog-loader.native.ts` does. | never — RN ships one bundle |
| The root navigator must never be empty. Every group is `if`-gated, and per-guard timers can disagree for a frame. | The ungrouped `Boot` route, and ONE phase value from `navigation/phase.tsx`. | never |
| A navigation group keyed by ROLE declares a shared screen twice, and a duplicate route name is a hard THROW, not a warning. Roles are stackable. | Key groups by CAPABILITY. | never |
| iOS CFNetwork merges its own cookie copy into our header and the server 401s. | `credentials: 'omit'` on RN — set in `@heliogrid/data`'s transport, not the client. | never |
| `pod install` fails with `Unicode Normalization not appropriate for ASCII-8BIT` unless the shell locale is UTF-8. | Prefix `LANG=en_US.UTF-8`. | never |
| `use_modular_headers!` in the Podfile is required by react-native-firebase. | Keep it. | react-native-firebase goes |
| Biome `a11y/useValidAriaRole` is OFF for this app on purpose: `AppText`'s `role` is a TYPOGRAPHY role, not an ARIA one, and it fired only on static literals. | Do not re-enable it. Real RN a11y goes through `accessibilityRole`. | `AppText` renames the prop |
| The native splash colour has no generator. Both artifacts were emitted by a deleted package and are FROZEN; a build does not refresh them. | Do not hand-edit. Re-emitting is owed by the mobile slice. | `packages/theme` re-emits them |

## packages/config

| trap | fix | retire when |
|---|---|---|
| An `extends` that climbs out of this package resolves to the CONSUMER's `node_modules` for any tool that does not realpath. `tsc` does realpath and hides it; Vite does not. A green typecheck does not prove these paths resolve. | Every `extends` here is package-relative (`./base.json`). | never — it is pnpm's symlink layout |
| Biome parses these as strict JSON, so a `//` comment turns the build red. | Reasons live in this package's `CLAUDE.md`. | Biome supports JSONC here |

## packages/contracts

| trap | fix | retire when |
|---|---|---|
| A new BASE error code no route's union names is invisible to the emitted OpenAPI — "spec unchanged" is NOT evidence that nothing happened. | Check the three edits by hand: `baseErrorCodes`, `errorHttpStatusByCode`, then the i18n copy `Record`, which fails to compile until it exists. | never |
| Every name in `src/workflows/` is permanent once a durable history exists: a type name is written into history, a task queue is what a running worker polls, a workflow id is an outbox dedupe key. | Choose once. Renaming later is a migration, not a rename. | never |

## packages/data

| trap | fix | retire when |
|---|---|---|
| ts-rest runs client response validation INSIDE the fetcher, so a contract mismatch surfaces in the transport's own `catch` as a raw `ZodError` that looks exactly like a failed request — classify it as network and a bad response becomes retryable. | The transport rethrows `ZodError` untouched. | never |
| `createServerDataContext` hoisted to a module constant serves the next visitor the previous visitor's session and cache. Both fields are request-bound. | Call it INSIDE the render and let it fall out of scope. | never |
| `lib: ["ES2023", "DOM"]` is load-bearing: without DOM, `Headers` is unknown and ts-rest's `FetchOptions` collapses to `never`, typing every fetch option `undefined`. | Keep the lib entry. | never |
| Metro resolves the `./react` subpath with no config on RN 0.86 / Metro 0.84. | If a downgrade breaks it: `unstable_enablePackageExports: true`. | never |

## packages/forms

| trap | fix | retire when |
|---|---|---|
| After a dependency bump `zodResolver`'s generics may reject the Zod-3 schema. | Pin `@hookform/resolvers` back to the 3.x line (3.10.0) — same import path. | the repo moves to Zod 4 |

## packages/i18n

| trap | fix | retire when |
|---|---|---|
| `installFormsErrorMap` mutates zod's PROCESS-GLOBAL error map, so it cannot be per-request. Correct on a client, where one mount has one language. | Each app root installs it, bound to that mount's translator. Server-side translation uses `createTranslator` instead. | a server-rendered form needs translated zod defaults — that is a new decision |
| Hermes needs the Intl polyfills BEFORE any ICU call. | `@heliogrid/i18n/rn` imported FIRST from `apps/mobile/src/i18n.ts`. | Hermes ships Intl |
| Without the statically-imported source catalog, `i18n.activate()` warns on every boot and a PRODUCTION build `console.warn`s on every fallback message. | Keep the static import in `languages.ts`. | never |
| `lingui.config.js` is CommonJS and runs outside any TS pipeline, so it needs BUILT contracts. It throws rather than falling back — a silent fallback would extract against the wrong language set with every gate green. | Build contracts first. | never |
| `@lingui/swc-plugin` (5.11.0 and 6.6.0) fails against this Next's swc_core, which is why web cannot use macros. | Runtime `<Trans id>` on both platforms. | a Next or plugin bump — then it is one mechanical sweep, ids already equal source text |

## packages/theme

| trap | fix | retire when |
|---|---|---|
| `ds:pull` is a Claude session action driving the DesignSync MCP, NOT a pnpm script. `pnpm ds:pull` will fail. | Drive the MCP in a session; the output is committed. | a script wraps it |

## packages/ui

| trap | fix | retire when |
|---|---|---|
| `knip` reports the deliberate web/native pair as a duplicate export and cannot see that Law 7 requires it. | Do not "fix" it by deleting a half. `check:unused` stays out of `verify` for this reason. | knip is configured to understand the pair |
| Measuring a touch target mid-animation lies: overlays animate in over 320ms from `scale(0.97)`. | Wait for `document.getAnimations()` to be quiet, or for `transform` to read `none`. | never |
