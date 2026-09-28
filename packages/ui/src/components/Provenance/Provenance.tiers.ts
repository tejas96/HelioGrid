/* Provenance's marks and its resolver — platform-neutral, so both halves and Charts read the same
   mark tokens. The WORDS are not here: they arrive from the consumer (`Provenance.words.ts`).

   THE TIER SET IS CLOSED (F8-03). A caller's own word is prose beside the tier — `source`.

   ABSENCE CAN BE DELIBERATE. M05-52 states that the geometric access numbers carry no marker and
   "that absence is itself required". `tier="unmarked"` renders nothing AND says so in the source,
   which is distinguishable from having forgotten. */

import type { ProvenanceTier } from '@heliogrid/contracts';
import type {
  ProvenanceMarkToken,
  ProvenanceProps,
  ProvenanceStanding,
  ProvenanceTierSpec,
} from './Provenance.types';

/** The mark each tier takes. */
export const TIER_MARK = {
  measured: 'success-text',
  derived: 'info-text',
  estimated: 'warning-text',
  assumed: 'text-tertiary',
} as const satisfies Record<ProvenanceTier, ProvenanceMarkToken>;

/** How far a figure can be relied on as final — the second axis (M11-42 / M06-41 / F5-59 / M05-06). */
export const STANDING_MARK = {
  confirmed: { color: 'success-text', mark: 'success' },
  provisional: { color: 'warning-text', mark: 'warning-text' },
  reported: { color: 'warning-text', mark: 'warning-text' },
  pending: { color: 'text-tertiary', mark: 'mark-subtle' },
} as const satisfies Record<
  ProvenanceStanding,
  { color: ProvenanceMarkToken; mark: ProvenanceMarkToken }
>;

/** The tier a spec names, or null for a deliberate absence. */
export function tierOf(tier?: ProvenanceTierSpec): ProvenanceTier | null {
  return tier === undefined || tier === 'unmarked' ? null : tier;
}

/** True when a spec would render NOTHING — lets a host skip the slot without guessing. */
export function isProvenanceEmpty(p: ProvenanceProps = {}): boolean {
  return !tierOf(p.tier) && !p.standing && !p.source && !p.projection && !p.note;
}

/** The clamped type step. The contract is 12 or 13; never below 12 — the type floor. */
export function provenanceStep(size: number): 12 | 13 {
  return size >= 13 ? 13 : 12;
}
