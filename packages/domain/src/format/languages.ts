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
 */
export const UI_LANGUAGES = ['en', 'hi', 'mr'] as const;
export type UiLanguage = (typeof UI_LANGUAGES)[number];

/**
 * The language message ids are authored in — Lingui's `sourceLocale`, whose catalog needs no
 * translation because the id IS the English text.
 */
export const UI_SOURCE_LOCALE = 'en' satisfies UiLanguage;

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
 * `F3-05` — the one fallback, so no surface writes `value[lang] ?? value.en` for itself. Generic
 * because tenant-authored document text (`F3-10`) and the platform's own defaults take the same
 * shape as a label: a T&C body per language falls back exactly as a stage name does.
 */
export function inLanguage<T>(value: PerLanguage<T>, language: UiLanguage): T {
  return value[language] ?? value.en;
}

export function packLabel(label: PackLabel, language: UiLanguage): string {
  return inLanguage(label, language);
}
