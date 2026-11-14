import type { DocumentBasis } from '../format/disclosure';

/** No design stands behind a V1 proposal (`F8-20`): its figures come from size and location. */
export const PROPOSAL_BASIS_WITHOUT_DESIGN: DocumentBasis = { designed: false, roofTier: null };

/**
 * The computation that produces a proposal's figures, by engine: a version pins the ones it was
 * generated under, and a change here reads every older unshared version as not current (`F8-17`).
 */
export const PROPOSAL_ENGINES = { proposal: '1' } as const;
