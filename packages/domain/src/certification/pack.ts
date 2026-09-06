/**
 * `pack.certification-schemes` — which certification schemes a market requires, and the
 * engineering-standards labels its documents carry (`F1-19`, `F1-20`). Two structures in one
 * key, in the rows' own order: (a) the schemes a catalog item is certified under and a picker
 * badges; (b) the standards names printed on electrical documents and drawing sheets.
 *
 * This is DATA. Every market's own word here (`ALMM`, `DCR`, `IS/IEC`) is a VALUE, never a
 * field name — so no module names a scheme and no module names a standards body (`F1-20`). A
 * scheme name belongs to a statutory body, which puts it in the never-translated set beside
 * operator names and `taxIdLabel` (`F3-08`): the key a market declares IS the text a badge
 * shows, spelled once here and nowhere else.
 *
 * The scheme set may be EMPTY, and an empty set is authored rather than missing: it means no
 * badges and no scheme gates in that market, never an error (`F1-19`).
 *
 * The catalog item that carries certifications is `M01`'s (`M01-34`) and the Generate-time gate
 * that fails a non-conforming one is `M06`'s (`M06-23`). This key declares what they read.
 */

/**
 * What a catalog item carries as proof under one scheme (`F1-44`). India needs both kinds: an
 * ALMM entry is a reference into the MNRE list, a DCR entry is a flag. The market declaring a
 * scheme says which, so `M01`'s item form collects the right evidence without knowing the
 * market.
 */
export const CERTIFICATION_EVIDENCE = ['flag', 'list_reference'] as const;

export type CertificationEvidence = (typeof CERTIFICATION_EVIDENCE)[number];

/**
 * One scheme a market requires (`F1-19`). The market's own value, validated as an open set
 * (`F1-09`) — never a closed enumeration baked into the product.
 */
export interface CertificationScheme {
  /** The scheme's own name — `ALMM`. A value, and the text a badge shows. */
  readonly scheme: string;
  readonly evidence: CertificationEvidence;
}

/**
 * What one catalog item claims under one scheme — the scheme-keyed certification `F1-19` puts
 * on an item specification.
 *
 * HOLDING an entry IS the compliance claim. An uncertified item carries none, so a gate reading
 * these fails closed rather than passing an item whose evidence nobody recorded — the silent
 * pass `F1-19` forbids.
 */
export interface Certification {
  /** A scheme the market declares. `certificationScheme` is what validates it. */
  readonly scheme: string;
  /**
   * The evidence a `list_reference` scheme demands — the MNRE ALMM list entry. `null` on a
   * `flag` scheme, whose entry is the claim itself.
   */
  readonly reference: string | null;
}

/**
 * The standards names printed on electrical documents, drawing sheets and design ladders
 * (`F1-20`). LABELS only: the ladders themselves are engineering rules data (`F1-01`), and
 * `M05-65`'s Edit-ratings form reads the family as its grid-and-standards value.
 */
export interface StandardsLabels {
  /** Named on every electrical document this market produces. */
  readonly family: string;
  /** Named in addition, on the drawings whose content demands it. `M05` decides which. */
  readonly additional: readonly string[];
}

export interface CertificationSchemesPack {
  /** `F1-19` — the schemes this market requires. Empty means no badges and no scheme gates. */
  readonly schemes: readonly CertificationScheme[];
  /** `F1-20` — what this market's documents name. Every market prints a family. */
  readonly standards: StandardsLabels;
}

/**
 * India (`F1-44`, `F1-45`). A reader checks this table against the PRD rows rather than
 * trusting the code.
 */
export const IN_CERTIFICATION_SCHEMES: CertificationSchemesPack = {
  /**
   * `F1-44` — the two schemes, and their evidence kinds are not interchangeable: an ALMM entry
   * references the MNRE list, while DCR is the flag the subsidy path gates on (`F1-34`).
   */
  schemes: [
    { scheme: 'ALMM', evidence: 'list_reference' },
    { scheme: 'DCR', evidence: 'flag' },
  ],
  /**
   * `F1-45` — the IS/IEC family on every electrical document, with CEA named on the drawings
   * that demand it. Authored as labels and never as a ladder: which CEA requirement a given
   * drawing carries is `M05`'s engineering rules data (`F1-01`).
   */
  standards: { family: 'IS/IEC', additional: ['CEA'] },
};
