/* Provenance's marks and its resolver — platform-neutral, so both halves and Charts read the same
   mark tokens. The WORDS are not here: they arrive from the consumer (`Provenance.words.ts`).

   THE TIER SET IS CLOSED (F8-03). A caller's own word is prose beside the tier — `source`.

   ABSENCE CAN BE DELIBERATE. M05-52 states that the geometric access numbers carry no marker and
   "that absence is itself required". `tier="unmarked"` renders nothing AND says so in the source,
   which is distinguishable from having forgotten. */

import type { ProvenanceTier } from '@heliogrid/contracts';
import type { Freshness, FreshnessWarning } from '@heliogrid/domain';
import type {
  ProvenanceMarkToken,
  ProvenanceProps,
  ProvenanceStanding,
  ProvenanceTierSpec,
  ProvenanceWords,
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

/** A figure that is not current reads like one that is not final: the provisional marks. */
export const FRESHNESS_MARK = STANDING_MARK.provisional;

/** The warning a figure's freshness carries, or null — a current figure and a record print none. */
export function freshnessWarning(freshness?: Freshness | null): FreshnessWarning | null {
  return freshness === undefined || freshness === null || freshness.kind === 'current'
    ? null
    : freshness;
}

/** The tier a spec names, or null for a deliberate absence. */
export function tierOf(tier?: ProvenanceTierSpec): ProvenanceTier | null {
  return tier === undefined || tier === 'unmarked' ? null : tier;
}

/** True when a spec would render NOTHING — lets a host skip the slot without guessing. */
export function isProvenanceEmpty(p: ProvenanceProps = {}): boolean {
  return (
    !tierOf(p.tier) &&
    !p.standing &&
    !freshnessWarning(p.freshness) &&
    !p.energySource &&
    !p.source &&
    !p.projection &&
    !p.note
  );
}

/** The clamped type step. The contract is 12 or 13; never below 12 — the type floor. */
export function provenanceStep(size: number): 12 | 13 {
  return size >= 13 ? 13 : 12;
}

/**
 * One part of the line, in the order it prints. A marked part (standing, freshness, tier) carries
 * its dot; standing and freshness also carry the ink their words take. Prose carries neither.
 */
export interface ProvenanceLinePart {
  id: 'standing' | 'freshness' | 'tier' | 'energySource' | 'source' | 'projection' | 'note';
  words: string;
  mark: ProvenanceMarkToken | null;
  ink: ProvenanceMarkToken | null;
}

/**
 * `standing · freshness · tier · energy source · source · projection · note` — standing leads,
 * because "this is not final" outranks "this is how it was worked out".
 */
export function provenanceLineParts(
  { tier, standing, freshness, energySource, source, projection, note }: ProvenanceProps,
  words: ProvenanceWords,
): ProvenanceLinePart[] {
  const parts: ProvenanceLinePart[] = [];
  if (standing) {
    const st = STANDING_MARK[standing];
    parts.push({ id: 'standing', words: words.standing(standing), mark: st.mark, ink: st.color });
  }
  const warning = freshnessWarning(freshness);
  if (warning) {
    parts.push({
      id: 'freshness',
      words: words.freshness(warning),
      mark: FRESHNESS_MARK.mark,
      ink: FRESHNESS_MARK.color,
    });
  }
  const t = tierOf(tier);
  if (t) {
    parts.push({ id: 'tier', words: words.tier(t), mark: TIER_MARK[t], ink: null });
  }
  for (const [id, prose] of [
    ['energySource', energySource ? words.energySource(energySource) : undefined],
    ['source', source],
    ['projection', projection],
    ['note', note],
  ] as const) {
    if (prose) {
      parts.push({ id, words: prose, mark: null, ink: null });
    }
  }
  return parts;
}

/**
 * What a host's `provenance` prop draws: a spec, or a bare tier made one, with the host's extras
 * over it — or nothing when it would render nothing. A bare tier goes through the same emptiness
 * guard as a spec: `renderProvenance("unmarked")` must hand back null, or every host draws its
 * slot around the deliberate absence.
 */
export function provenanceSpecOf(
  spec: ProvenanceProps | ProvenanceTierSpec | null | undefined,
  extra: Partial<ProvenanceProps>,
): ProvenanceProps | null {
  if (!spec) {
    return null;
  }
  const props: ProvenanceProps = typeof spec === 'string' ? { tier: spec } : spec;
  const merged = { ...props, ...extra };
  return isProvenanceEmpty(merged) ? null : merged;
}
