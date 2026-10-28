# @heliogrid/i18n — ONE Lingui catalog (EN/HI/MR) for Next.js AND bare RN

Deps: `architecture.md` §2 i18n. `packages/ui` takes its copy as props.

## What lives here / what must never live here

- `src/copy/` modules are pure data — React-free, JSX banned, extractor-swept via leading
  `/*i18n*/` descriptors. Where a closed set exists the module is a `Record` over the contract
  enum. Screen-specific copy stays in its screen.
- NEVER: app copy hard-coded elsewhere, a per-app catalog, agent or WhatsApp templates (tenant
  DATA), or a raw Intl currency format.

## Where files go

```
src/copy/<area>.ts            copy BOTH platforms need — pure data, no React, no JSX
src/locales/<lang>/           messages.po (source of truth) + messages.ts (compiled by `build`, committed, never hand-edited)
src/index.ts                  REACT-FREE root — re-exports the runtime, metadata and copy
src/runtime.ts                createI18nRuntime, createTranslator
src/languages.ts              LANGUAGE_META + the statically-imported source catalog
src/catalog-loader.ts         web: one import() chunk per language
src/catalog-loader.native.ts  RN: static imports — Metro substitutes it, because `import()`
                              cannot lazy-load on the phone
src/react/                    the ONE provider and hooks both platforms use
src/rn/                       Hermes Intl polyfills — global side effects, own entry
```

Entries: `.` (React-free: `createI18nRuntime` for a mount, `createTranslator` for server or
background work), `./react` (provider and hooks), `./rn` (Hermes polyfills that install globals).

## Commands

```
pnpm --filter @heliogrid/i18n extract | build | typecheck   # extract sweeps web, mobile and ui
```

## Local conventions

- **THE CONVENTION: runtime `<Trans id="<English source text>" />`** from `@heliogrid/i18n/react`,
  both platforms. The id IS the English string, so the first paint is right before any catalog
  loads.
- **The language SET is not written here:** `UI_LANGUAGES` is authored in
  `packages/domain/src/format/languages.ts`.
- **The provider FOLLOWS the session.** A root mounts `LanguageFollowsUser` with
  `follow={user?.interfaceLanguage ?? null}`, `device` and `onChosen`; a screen calls `setLocale`
  and never writes the profile itself (`F3-02`, `F3-04`). With nobody signed in the mount rests in
  `device` — the device's first language where the set holds it (`F3-03`), else null and the
  runtime's own language — or in the language chosen on the door since. A screen reads it as
  `useI18n().device`.
- **One instance per mount and per request. Never a module-scope one** — Next evaluates a module
  once per server process and shares it across every request, so a module-level `setupI18n()` is
  one mutable active locale for every concurrent visitor.
- `t(COPY.key, values)` in hooks and handlers — the descriptor itself, never `.id` · `<Trans>` in markup · `createTranslator(locale)` off the
  React tree. Store message IDs plus data, never a translated business record — that is wrong for
  every other reader of it. A notification is the one exception: it has one reader, and `F6-08`
  fixes its words in that reader's language when the api writes it (`createTranslator`).

## Adding a language

Follow `docs/engineering/adding-a-language.md`; the `language-fonts` invariant and
`tests/plural-forms.test.ts` refuse a half-added one.

## Done means

Every locale has zero missing messages, or the gap is a deliberate English fallback · every
language RENDERED on web and on both phones, switching and not merely loading.
