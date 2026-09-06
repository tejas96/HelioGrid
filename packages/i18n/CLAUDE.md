# @heliogrid/i18n — ONE Lingui catalog (EN/HI/MR) for Next.js AND bare RN

Traps: `docs/engineering/landmines.md` · deps:
`architecture.md` §2 i18n. `packages/ui` stays string-free: copy arrives as props.

## What lives here / what must never live here

- The `.po` catalogs (the translation source of truth) and their COMPILED `messages.ts` · the
  `LANGUAGE_META` table · the catalog loaders · the runtime and translator factories · the ONE
  React provider both platforms use · the Hermes Intl polyfills · `src/copy/` for copy both
  platforms render.
- The `@lingui` and `@formatjs` DEPENDENCIES. Neither app declares them, so swapping the message
  library touches `src/react/` and nothing in either app.
- `src/copy/` modules are pure data — React-free, JSX banned, extractor-swept via leading
  `/*i18n*/` descriptors. Where a closed set exists the module is a `Record` over the contract
  enum. Screen-specific copy stays in its screen.
- NEVER: app copy hard-coded elsewhere, a per-app catalog, the language LIST (that is
  `packages/contracts/src/locale.ts`), agent or WhatsApp templates (those are tenant DATA), or a
  raw Intl currency format.

## Where files go

```
src/copy/<area>.ts            copy BOTH platforms need — pure data, no React, no JSX
src/locales/<lang>/           messages.po (source of truth) + messages.ts (compiled, committed)
src/index.ts                  REACT-FREE root — createI18nRuntime, createTranslator, metadata
src/languages.ts              LANGUAGE_META + the statically-imported source catalog
src/catalog-loader.ts         web: one import() chunk per language
src/catalog-loader.native.ts  RN: static imports (Metro substitutes it — see the landmine)
src/react/                    the ONE provider and hooks both platforms use
src/rn/                       Hermes Intl polyfills — global side effects, own entry
```

## Three entry points

`.` is REACT-FREE — `createI18nRuntime(locale)` for a mount, `createTranslator(locale)` for
isolated server or background work, plus the metadata and copy modules. `./react` is the provider
and hooks. `./rn` is the Hermes polyfills, separate because importing it INSTALLS GLOBALS a web
bundle must never take.

## Commands

```
pnpm --filter @heliogrid/i18n extract | build | typecheck   # extract sweeps web, mobile and ui
```

Run `extract` before committing: CI fails if the catalogs are not fresh (`M47`).

## Local conventions

- **THE CONVENTION: runtime `<Trans id="<English source text>" />`** on both platforms, from
  `@heliogrid/i18n/react`. The id IS the English string, so ids double as msgids and the extractor
  keeps ONE entry per message. Never mix macro `<Trans>` and explicit-id usage for the same
  string — the extractor forks them into duplicate entries and translations are lost. It is also
  why the first paint is correct with no catalog fetched: a missing message renders its id.
- **The language SET is not written here.** `UI_LANGUAGES` in `packages/contracts/src/locale.ts`
  is the one authoring, and `lingui.config.js` reads it too. `LANGUAGE_META` and both catalog
  loaders are `satisfies Record<UiLanguage, …>` (`M48`).
- **One instance per mount and per request. Never a module-scope one** — Next evaluates a module
  once per server process and shares it across every request, so a module-level `setupI18n()` is
  one mutable active locale for every concurrent visitor.
- `t(id, values)` in hooks and handlers · `<Trans>` in markup · `createTranslator(locale)` off the
  React tree. Store message IDs plus data, never a translated business record — that is wrong for
  every other reader of it.
- **UI language is not the tenant MARKET.** Language is per user; currency grouping, tax scheme
  and paperwork come from the market pack. A Marathi-reading user in an Indian tenant still sees
  INR in lakh/crore. Never derive one from the other.
- The catalog loader is platform-FORKED and has to be: web uses `import()` so webpack splits one
  chunk per language, and `catalog-loader.native.ts` imports all three statically.
- Compiled `messages.ts` files are generated. Never hand-edit them.

## Done means

`extract` leaves the tree clean · every locale has zero missing messages, or the gap is a
deliberate English fallback · every language RENDERED on web and both simulators, switching and
not merely loading.
