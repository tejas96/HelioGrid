import type { Certification, CertificationScheme, CertificationSchemesPack } from './pack';

/**
 * The reads of `pack.certification-schemes` (`F1-19`): whether a market declares a scheme, what
 * a picker badges, whether an item holds one, and which required schemes a market never
 * declared.
 *
 * These are the only reads of the scheme set, which is what keeps a scheme name out of every
 * caller: `M01` renders the badges and `M06` runs the gate, and neither spells `ALMM`.
 */

/**
 * The market's declaration for a scheme, or `null` where the market declares none — which IS
 * the open-set validation `F1-09` asks for: a scheme the pack does not declare is not a scheme
 * in that market, and no closed enumeration decides it.
 */
export function certificationScheme(
  certification: CertificationSchemesPack,
  scheme: string,
): CertificationScheme | null {
  return certification.schemes.find((declared) => declared.scheme === scheme) ?? null;
}

/**
 * The schemes a picker badges, in the order the market declares them (`F1-19`). A market
 * declaring none returns nothing, so the picker renders no badge chrome rather than an empty
 * row (`M01-34`, `M05-37`).
 */
export function badgedSchemes(certification: CertificationSchemesPack): readonly string[] {
  return certification.schemes.map((declared) => declared.scheme);
}

/**
 * Whether an item is certified under a scheme. Presence of the entry IS the claim, so an item
 * carrying none fails — the reading that lets a gate fail closed (`F1-19`).
 */
export function holdsScheme(held: readonly Certification[], scheme: string): boolean {
  return held.some((certification) => certification.scheme === scheme);
}

/**
 * Scheme keys a pack rule requires that this market does not declare (`F1-19`).
 *
 * Empty is the only correct answer for an authored pack. A rule naming an undeclared scheme
 * gates on nothing and passes every non-conforming component silently, which is the one outcome
 * `F1-19` forbids — and renaming a scheme is exactly how a market pack would reach that state.
 * An open-set vocabulary cannot be tied by a type (`F1-09`), so this read is what ties the two
 * keys, and `tests/certification/pack.test.ts` runs it over the authored pack.
 */
export function undeclaredSchemes(
  certification: CertificationSchemesPack,
  required: readonly string[],
): readonly string[] {
  return required.filter((scheme) => certificationScheme(certification, scheme) === null);
}

/** How a claim stands under a market: held, or the one way it is not. */
export type CertificationVerdict =
  | 'held'
  | 'undeclared'
  | 'reference_missing'
  | 'reference_unexpected';

/**
 * Whether one claim may be held under this market (`F1-19`, `F1-44`): the scheme must be one the
 * market declares, and the evidence must be the kind the scheme demands — a `list_reference`
 * scheme carries its reference, a `flag` scheme carries none. The platform publish and the own-SKU
 * create refuse anything else at the write, so a false claim never reaches a badge or M06's gate.
 */
export function certificationVerdict(
  certification: CertificationSchemesPack,
  claim: Certification,
): CertificationVerdict {
  const declared = certificationScheme(certification, claim.scheme);
  if (declared === null) return 'undeclared';
  if (declared.evidence === 'list_reference') {
    return claim.reference === null ? 'reference_missing' : 'held';
  }
  return claim.reference === null ? 'held' : 'reference_unexpected';
}
