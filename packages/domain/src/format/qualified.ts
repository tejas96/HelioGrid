import type { MinorUnits } from '../money/minor-units';
import { formatCompactMoney, formatMinorUnits, formatMoney, type MoneyOptions } from './money';
import type { Numberish } from './number';
import type { FormatPack } from './pack';

/**
 * The honesty half of the format layer (`F3-24`) — a figure and the obligations it carries,
 * obtained together or not at all.
 *
 * **Why this is a value and not a prop.** A tier passed beside an amount is a tier a narrow
 * screen can leave out, and `F3-24` names that exact temptation: compact notation and small
 * screens are where a qualifier gets dropped "for space". Here the amount cannot be produced
 * without its tier, and compacting rewrites only the figure — so the layout gives way and the
 * content does not.
 *
 * The three laws it joins, each owned elsewhere and consumed here: every user-visible quantity
 * carries exactly one tier (`F8-01`), a figure that is not reconciled reads provisional rather
 * than final (`F8-12`), and one computed figure renders identically wherever it appears with the
 * same tier and the same disclosure (`F8-24`).
 */

/**
 * The four tiers, product-wide (`F8-01`). A readonly tuple, so `packages/contracts` derives its
 * `z.enum` from this one list rather than restating it — the shape `MEASUREMENT_SYSTEMS` takes.
 *
 * `packages/domain` cannot import `packages/contracts`, so the format layer that carries a tier
 * has to own the tier's words; the design system's OPEN tier vocabulary (a caller's own phrase,
 * `"Verified datasheet"`) is a separate thing and stays where it is drawn.
 */
export const PROVENANCE_TIERS = ['measured', 'derived', 'estimated', 'assumed'] as const;
export type ProvenanceTier = (typeof PROVENANCE_TIERS)[number];

/**
 * The second axis (`F8-12`): how far a figure can be relied on as FINAL. Orthogonal to the tier —
 * a derived figure computed from a stale version is still derived, and still must not read final.
 */
export const PROVENANCE_STANDINGS = ['confirmed', 'provisional', 'reported', 'pending'] as const;
export type ProvenanceStanding = (typeof PROVENANCE_STANDINGS)[number];

/** What a caller must state about a figure before the layer will render it. */
export interface Qualifier {
  /** Exactly one, always — `F8-01` has no default and no absent case for a quantity. */
  readonly tier: ProvenanceTier;
  /** Omitted where nothing was claimed; never invented to fill the field. */
  readonly standing?: ProvenanceStanding;
  /** The words that must travel with the figure — `"Excludes subsidy"` (`F8-24`). */
  readonly disclosure?: string;
}

/**
 * A rendered figure and everything that must render with it. The one shape a surface, a document,
 * an export and the voice agent all read, so two renderings of one figure cannot disagree
 * (`F8-24`).
 */
export interface QualifiedAmount {
  /**
   * The computed figure itself, in MAJOR units — the one source every rendering re-reads
   * (`F8-24`). It travels with the value so that compacting re-renders this figure rather than
   * whichever number a second call site happened to hold.
   */
  readonly value: Numberish;
  /** The figure as the reader sees it. Empty for a value that is not a number — never `NaN`. */
  readonly text: string;
  readonly tier: ProvenanceTier;
  readonly standing: ProvenanceStanding | null;
  readonly disclosure: string | null;
}

function qualified(value: Numberish, text: string, qualifier: Qualifier): QualifiedAmount {
  return {
    value,
    text,
    tier: qualifier.tier,
    standing: qualifier.standing ?? null,
    disclosure: qualifier.disclosure ?? null,
  };
}

/** A major-unit amount with its obligations — the ordinary screen figure. */
export function qualifyMoney(
  pack: FormatPack,
  amount: Numberish,
  qualifier: Qualifier,
  options?: MoneyOptions,
): QualifiedAmount {
  return qualified(amount, formatMoney(pack, amount, options), qualifier);
}

/**
 * A minor-unit amount with its obligations, printed TO the minor unit — the figure that has to
 * reconcile (`F1-07`). Never rounded to the screen default on the way out.
 */
export function qualifyMinorUnits(
  pack: FormatPack,
  amount: MinorUnits,
  qualifier: Qualifier,
): QualifiedAmount {
  /* The held value is the MAJOR-unit figure the text shows, so compacting it later reads the
     same number a reader read rather than a paise count a thousand times larger. */
  const major = amount / 10 ** pack.minorUnitDigits;
  return qualified(major, formatMinorUnits(pack, amount), qualifier);
}

/**
 * The compact figure, carrying the SAME obligations the full rendering carried.
 *
 * It takes a qualified amount rather than a raw number on purpose: compacting is the one place
 * `F3-24` says a qualifier gets lost, so the only way to reach the compact form is through a
 * value that already has one.
 */
export function compactQualified(pack: FormatPack, amount: QualifiedAmount): QualifiedAmount {
  return { ...amount, text: formatCompactMoney(pack, amount.value) };
}

/**
 * Every obligation on a figure, as the words a reader must be shown. A surface renders this list
 * whole or renders no figure — there is no subset that is still honest.
 */
export function qualifiers(amount: QualifiedAmount): string[] {
  const words: string[] = [amount.tier];
  if (amount.standing !== null) words.push(amount.standing);
  if (amount.disclosure !== null) words.push(amount.disclosure);
  return words;
}
