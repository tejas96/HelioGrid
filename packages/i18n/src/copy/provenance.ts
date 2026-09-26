import type { ProvenanceStanding, ProvenanceTier } from '@heliogrid/contracts';
import type { MessageRef, Translator } from '../runtime';

/**
 * The four tiers' words (`F8-02`). The identity stays the English token; only the display is
 * translated, and no translation may give two tiers one word (`F3-12`) — held by the registry in
 * `closed-vocabularies.ts`.
 */
export const PROVENANCE_TIER_WORD: Record<ProvenanceTier, MessageRef> = {
  measured: /*i18n*/ { id: 'Measured' },
  derived: /*i18n*/ { id: 'Derived' },
  estimated: /*i18n*/ { id: 'Estimated' },
  assumed: /*i18n*/ { id: 'Assumed' },
};

/**
 * How far a figure can be relied on as final — printed on the same label as its tier, so these
 * words must also differ from every tier word.
 */
export const PROVENANCE_STANDING_WORD: Record<ProvenanceStanding, MessageRef> = {
  confirmed: /*i18n*/ { id: 'Confirmed' },
  provisional: /*i18n*/ { id: 'Provisional' },
  reported: /*i18n*/ { id: 'Reported' },
  pending: /*i18n*/ { id: 'Not yet calculated' },
};

/** The tier in the reader's language — `translate` is the mount's `t`. */
export function tierLabel(translate: Translator['t'], tier: ProvenanceTier): string {
  return translate(PROVENANCE_TIER_WORD[tier]);
}

/** The standing in the reader's language — `translate` is the mount's `t`. */
export function standingLabel(translate: Translator['t'], standing: ProvenanceStanding): string {
  return translate(PROVENANCE_STANDING_WORD[standing]);
}
