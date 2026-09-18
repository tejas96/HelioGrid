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
 * `F3-05` — the one SILENT fallback, so no surface writes `value[lang] ?? value.en` for itself.
 * For a pack label and the platform's own copy, English in place of an unauthored Hindi is the
 * ruled behaviour and needs no note. It is NOT the door for a tenant's own words: `F3-10` forbids
 * showing a different language's version as if it were the reader's, so `AuthoredPerLanguage`
 * resolves through `authoredIn` below, which says which language was shown.
 */
export function inLanguage<T>(value: PerLanguage<T>, language: UiLanguage): T {
  return value[language] ?? value.en;
}

export function packLabel(label: PackLabel, language: UiLanguage): string {
  return inLanguage(label, language);
}

/**
 * Tenant-authored content per language (`F3-10`) — a template, a knowledge-base entry, document
 * terms — under a name that says which law applies. The SHAPE is a pack label's, because the store
 * and the wire are one; the LAW is not: the product never machine-translates it, never fills one
 * language from another, and never shows a version as a language it is not. It resolves through
 * `authoredIn`, never `inLanguage`.
 */
export type AuthoredPerLanguage<T> = PerLanguage<T>;

/** What a reader gets from authored content: the value, and the truth about its language. */
export interface AuthoredInLanguage<T> {
  readonly value: T;
  /** The language the reader asked for. */
  readonly requested: UiLanguage;
  /** The language actually shown — `requested` where the tenant wrote it, else the original. */
  readonly shownIn: UiLanguage;
  /** The set's languages with no version yet, in the set's order — the author's gap list. */
  readonly missing: readonly UiLanguage[];
}

/** A stored version exists — null is an absent version, never content. */
function isWritten<T>(version: T | undefined | null): version is NonNullable<T> {
  return version !== undefined && version !== null;
}

/**
 * `F3-10`'s fallback, LABELLED (owner ruling): the reader's language where the tenant wrote it,
 * otherwise the ORIGINAL — `en`, the version the type requires — with `shownIn` saying so, so the
 * surface can carry the note beside it. Never a third language: a Hindi version is not shown to a
 * Marathi reader as if it were Marathi, however close the two sit. `missing` is the same gap seen
 * from the author's side, so the switcher and the note cannot disagree about what is unwritten.
 */
export function authoredIn<T>(
  content: AuthoredPerLanguage<T>,
  requested: UiLanguage,
): AuthoredInLanguage<T> {
  const written = content[requested];
  return {
    value: isWritten(written) ? written : content.en,
    requested,
    shownIn: isWritten(written) ? requested : UI_SOURCE_LOCALE,
    missing: UI_LANGUAGES.filter((language) => !isWritten(content[language])),
  };
}
