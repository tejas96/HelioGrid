/**
 * The UI language set, and what a pack-declared label looks like in it.
 *
 * **The set lives HERE, not in contracts**. A pack label is per-language data on the
 * pack (`F1-22` declares it, `F1-11` makes a label change a data update rather than a release),
 * so `packages/domain` must be able to name a language — and this package imports nothing in the
 * workspace, so it cannot reach the contract's `UiLanguage`. Contracts derives `z.enum` from this
 * tuple the way it already does for `ROLE_PRESETS`, and re-exports it, so no consumer moved.
 *
 * Per-USER, not per-tenant (`D25`), and distinct from the tenant's MARKET: a Marathi-reading user
 * in an Indian tenant still reads INR in lakh/crore grouping. Never derive one from the other.
 *
 * Adding a language is ONE entry below plus its catalog — the playbook in
 * `docs/engineering/adding-a-language.md`. `pnpm check:all` refuses it until the language is ready
 * (`F3-26`, `F3-27`): the typecheck names every loader still missing it, `check:catalogs` every
 * untranslated line, and the invariant `language-fonts` every glyph no bundled face draws.
 */

/** What the product knows about a language beyond its code. */
export interface LanguageFacts {
  /** The language's own name, for a picker. NEVER translated: a reader finds it in their script. */
  readonly endonym: string;
  /** Writing direction, so a right-to-left language is a data edit, not a layout rewrite. */
  readonly dir: 'ltr' | 'rtl';
}

/**
 * THE language set, keyed by BCP-47 tag — the key is what `<html lang>`, `Intl` and the catalog
 * folder receive. Key order is the picker's order and `UI_LANGUAGES`' order.
 */
export const LANGUAGES = {
  en: { endonym: 'English', dir: 'ltr' },
  hi: { endonym: 'हिन्दी', dir: 'ltr' },
  mr: { endonym: 'मराठी', dir: 'ltr' },
} as const satisfies Readonly<Record<string, LanguageFacts>>;

export type UiLanguage = keyof typeof LANGUAGES;

/**
 * The set as a tuple, for `z.enum` and the database enum. `Object.keys` keeps insertion order, and
 * `LANGUAGES` is non-empty by construction, so the tuple type is exact.
 */
export const UI_LANGUAGES = Object.keys(LANGUAGES) as unknown as readonly [
  UiLanguage,
  ...UiLanguage[],
];

/**
 * The language message ids are authored in — Lingui's `sourceLocale`, whose catalog needs no
 * translation because the id IS the English text.
 */
export const UI_SOURCE_LOCALE = 'en' satisfies UiLanguage;

/**
 * A language as a response carries it, read by a build that may be older than the server: a
 * phone in the field meets the language a later release added. It reads the source language —
 * the one every catalog falls back to (`F3-05`) — and the person's stored choice is untouched,
 * so the next build that knows the language shows it. Never a refusal of the whole response.
 */
export function uiLanguageOrSource(language: string): UiLanguage {
  return UI_LANGUAGES.find((known) => known === language) ?? UI_SOURCE_LOCALE;
}

/**
 * A language tag as a device, a browser or a request header writes it (`hi-IN`, `hi_IN`, `HI`),
 * read by its primary subtag. Null when the set does not hold it: "not offered" is a different
 * answer from English (`F3-03`), and a caller that wants the source language says so itself.
 */
export function uiLanguageOfTag(tag: string | undefined): UiLanguage | null {
  const primary = tag?.trim().split(/[-_]/)[0]?.toLowerCase();
  return UI_LANGUAGES.find((known) => known === primary) ?? null;
}

/**
 * One pack-declared label, per language.
 *
 * **English is REQUIRED and the others are not**, which is `F3-05` in the type: a missing
 * translation falls back to English at runtime, never a bare key and never a blank. An unauthored
 * Hindi label is a content gap to be filled, not a failure state — so a market may author a label
 * the day it has English for it, and the pack revision that adds Marathi is a data update.
 *
 * Statutory and operator names take one value, not three: `DISCOM`, `ALMM` and `GSTIN` are in the
 * never-translated set (`F3-08`), so their label carries `en` alone and reads identically in every
 * language by construction rather than by three identical strings.
 */
export type PerLanguage<T> = Readonly<{ en: T } & Partial<Record<UiLanguage, T>>>;
export type PackLabel = PerLanguage<string>;

/**
 * `F3-05` — the one SILENT fallback, so no surface writes `value[lang] ?? value.en` for itself.
 * For a pack label, English in place of an unauthored Hindi is the ruled behaviour and needs no
 * note. A tenant's own words never come here: they are one value, shown as written (`F3-10`).
 */
export function inLanguage<T>(value: PerLanguage<T>, language: UiLanguage): T {
  return value[language] ?? value.en;
}

export function packLabel(label: PackLabel, language: UiLanguage): string {
  return inLanguage(label, language);
}
