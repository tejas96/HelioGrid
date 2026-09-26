import type { ProvenanceTier } from './qualified';

/**
 * What a document must say about itself (`F8.4`): the line that names its basis and the tiers its
 * figures may carry. The words are `@heliogrid/i18n`'s; this decides which apply, once, for the
 * document, the customer link and every export. A projection's assumptions are `projection.ts`'s.
 */

/**
 * The two basis lines; a document carries at most one. `indicative` is `F8-20`'s line for a
 * document with no design; `imageryBasis` is `F8-22`'s for a design whose roof nobody measured on
 * site.
 */
export const BASIS_LINES = ['indicative', 'imageryBasis'] as const;
export type BasisLine = (typeof BASIS_LINES)[number];

/** The two facts a document's basis is read from (`M06-51`). */
export interface DocumentBasis {
  /** Whether a design stands behind the document — Path A, not Path B. */
  readonly designed: boolean;
  /** The tier the design's roof capture was stamped with; `null` where none was. */
  readonly roofTier: ProvenanceTier | null;
}

/**
 * The line a document carries, or `null` when its roof was measured on site. With no design the
 * figures come from size and location, so the indicative line says so whatever survey exists. A
 * design whose roof is not stamped `measured` — unstamped included — must not read as a site
 * survey (`F8-22`).
 */
export function basisLineOf(basis: DocumentBasis): BasisLine | null {
  if (!basis.designed) return 'indicative';
  return basis.roofTier === 'measured' ? null : 'imageryBasis';
}

/**
 * Whether a figure's tier may stand on this document (`F8-21`). With no design, only the heuristic
 * tiers: a `derived` or `measured` figure would borrow a modelled design's confidence. It answers
 * and never rewrites — weakening the tier would hide the builder's mistake and give a typed figure
 * `estimated` where the owner's ruling makes it `assumed`.
 */
export function tierFitsBasis(basis: DocumentBasis, tier: ProvenanceTier): boolean {
  return basis.designed || tier === 'estimated' || tier === 'assumed';
}
